#!/usr/bin/env python3
"""
Elfa Auto MCP Server
Manages trigger CRUD via Elfa Auto API — price alerts, recurring updates, conditional execution.
Uses Elfa's /v2/auto/chat for NL→EQL translation and /v2/auto/queries for lifecycle management.
"""
import os
import sys
import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from fastmcp import FastMCP
from dotenv import load_dotenv
import httpx

# Load from project root
_root = Path(__file__).resolve().parent
while not (_root / '.env').exists() and _root != _root.parent:
    _root = _root.parent
load_dotenv(_root / '.env')

# Add parent paths for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from db.database import SessionLocal
from db.models import UserProfile, UserTrigger, Waitlist

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ELFA_API_KEY = os.environ.get("ELFA_API_KEY", "")
ELFA_BASE_URL = "https://api.elfa.ai/v2/auto"
ELFA_WEBHOOK_URL = os.environ.get("ELFA_WEBHOOK_URL", "")
DEFAULT_EXPIRY = "168h"  # 7 days (max supported by Elfa)

mcp = FastMCP(name="elfa-auto")


async def _elfa_request(method: str, path: str, json_data: dict = None) -> dict:
    """Make an authenticated request to the Elfa Auto API."""
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.request(
            method,
            f"{ELFA_BASE_URL}{path}",
            headers={
                "x-elfa-api-key": ELFA_API_KEY,
                "Content-Type": "application/json",
            },
            json=json_data,
        )
        if resp.status_code not in (200, 201, 202):
            logger.error(f"Elfa API error: {resp.status_code} — {resp.text}")
            return {"error": f"Elfa API error: {resp.status_code}", "detail": resp.text}
        return resp.json()


def _classify_trigger(description: str) -> str:
    """Classify trigger type from the user's description."""
    desc_lower = description.lower()
    # Auto-execute keywords
    if any(kw in desc_lower for kw in ["buy ", "sell ", "swap ", "send ", "transfer "]):
        if any(kw in desc_lower for kw in [" if ", " when ", " once ", " after "]):
            return "auto_execute"
    # Recurring keywords
    if any(kw in desc_lower for kw in ["every ", "hourly", "daily", "each hour", "each day", "recurring", "update me"]):
        return "recurring"
    # Default: alert
    return "alert"


def _extract_action_config(description: str, eql_json: dict) -> Optional[dict]:
    """Extract action config for auto_execute triggers from the description."""
    # For auto_execute, we need to parse the intended trade from the description
    # The agent should provide structured action_config, but as fallback parse from description
    # This is a basic extraction — the agent prompt should encourage structured params
    return None  # Agent will pass action_config explicitly via the tool


@mcp.tool()
async def create_trigger(
    telegram_user_id: int,
    description: str,
    action_config: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Create a new trigger that monitors a condition and fires a webhook when met.
    Uses Elfa Auto's AI to translate natural language into a monitoring query.

    Args:
        telegram_user_id: The Telegram user ID
        description: Natural language description of the trigger, e.g.:
            - "Alert me when SOL hits $200"
            - "Ping me when $TROLL pumps 5% in 1 hour"
            - "Update me about SOL price every hour"
            - "Buy $500 of SOL if it drops below $140"
        action_config: Optional JSON string with execution config for auto-execute triggers.
            e.g. '{"action": "swap", "params": {"from": "USDC", "to": "SOL", "amount": 500}}'

    Returns:
        Trigger details or error
    """
    if not ELFA_API_KEY:
        return {"status": "error", "error": "Elfa API key not configured"}
    if not ELFA_WEBHOOK_URL:
        return {"status": "error", "error": "Webhook URL not configured"}

    db = SessionLocal()
    try:
        # Check user exists (in user_profiles OR waitlist)
        user = db.query(UserProfile).filter_by(telegram_user_id=telegram_user_id).first()
        if not user:
            # Bouncer/waitlisted users may not have a user_profiles entry yet
            waitlist_user = db.query(Waitlist).filter_by(telegram_user_id=telegram_user_id).first()
            if not waitlist_user:
                return {"status": "error", "error": "User not found. Please use /start first."}
            # Create a minimal profile so FK constraint is satisfied
            user = UserProfile(
                telegram_user_id=telegram_user_id,
                telegram_username=waitlist_user.telegram_username,
            )
            db.add(user)
            db.flush()  # Get the ID without committing yet

        # Step 1: Use Elfa chat to translate NL → EQL
        webhook_url = ELFA_WEBHOOK_URL
        chat_prompt = (
            f"Return the final EQL JSON immediately, no questions. "
            f"Task: {description}. "
            f"Webhook URL: {webhook_url}. "
            f"expiresIn: {DEFAULT_EXPIRY}. "
            f"Do not ask for clarification. Just return the JSON code block."
        )
        chat_result = await _elfa_request("POST", "/chat", {"message": chat_prompt})
        if "error" in chat_result:
            return {"status": "error", "error": f"Failed to build query: {chat_result.get('detail', chat_result['error'])}"}

        # Extract EQL JSON from chat response
        response_text = chat_result.get("response", "")
        eql_json = None
        try:
            # Find JSON block in response
            json_start = response_text.find("```json")
            if json_start != -1:
                json_start = response_text.index("\n", json_start) + 1
                json_end = response_text.index("```", json_start)
                eql_json = json.loads(response_text[json_start:json_end])
            else:
                # Try parsing the whole response as JSON
                json_start = response_text.find("{")
                json_end = response_text.rfind("}") + 1
                if json_start != -1 and json_end > json_start:
                    eql_json = json.loads(response_text[json_start:json_end])
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Failed to parse EQL from Elfa chat: {e}\nResponse: {response_text}")
            return {"status": "error", "error": "Failed to parse trigger query from AI. Try rephrasing your request."}

        if not eql_json:
            # Retry with more forceful prompt if first attempt didn't return JSON
            logger.info("First chat attempt didn't return JSON, retrying...")
            retry_prompt = (
                f"You must return ONLY a JSON code block with valid EQL. No explanation, no questions. "
                f"Task: {description}. "
                f"Webhook URL: {webhook_url}. expiresIn: {DEFAULT_EXPIRY}."
            )
            chat_result = await _elfa_request("POST", "/chat", {"message": retry_prompt})
            if "error" not in chat_result:
                response_text = chat_result.get("response", "")
                try:
                    json_start = response_text.find("```json")
                    if json_start != -1:
                        json_start = response_text.index("\n", json_start) + 1
                        json_end = response_text.index("```", json_start)
                        eql_json = json.loads(response_text[json_start:json_end])
                    else:
                        json_start = response_text.find("{")
                        json_end = response_text.rfind("}") + 1
                        if json_start != -1 and json_end > json_start:
                            eql_json = json.loads(response_text[json_start:json_end])
                except (json.JSONDecodeError, ValueError):
                    pass

        if not eql_json:
            return {"status": "error", "error": "Could not generate a valid trigger query. Try rephrasing your request."}

        # Ensure webhook URL and expiry are set
        if "actions" in eql_json:
            for action in eql_json["actions"]:
                if action.get("type") == "webhook":
                    action["params"] = action.get("params", {})
                    action["params"]["url"] = webhook_url
        if "expiresIn" not in eql_json:
            eql_json["expiresIn"] = DEFAULT_EXPIRY

        # Step 2: Validate the EQL
        validate_result = await _elfa_request("POST", "/queries/validate", {"query": eql_json})
        if "error" in validate_result:
            return {"status": "error", "error": f"Query validation failed: {validate_result.get('detail', validate_result['error'])}"}
        if not validate_result.get("valid"):
            errors = validate_result.get("errors", [])
            error_msgs = [e.get("message", str(e)) for e in errors]
            return {"status": "error", "error": f"Invalid trigger query: {'; '.join(error_msgs)}"}

        # Step 3: Create the query
        create_result = await _elfa_request("POST", "/queries", {"query": eql_json})
        if "error" in create_result:
            return {"status": "error", "error": f"Failed to create trigger: {create_result.get('detail', create_result['error'])}"}

        elfa_query_id = create_result.get("id") or create_result.get("queryId", "")
        if not elfa_query_id:
            return {"status": "error", "error": "Trigger created but no query ID returned."}

        # Classify trigger type
        trigger_type = _classify_trigger(description)

        # Parse action_config if provided
        parsed_action_config = None
        if action_config:
            try:
                parsed_action_config = json.loads(action_config)
            except json.JSONDecodeError:
                logger.warning(f"Invalid action_config JSON: {action_config}")

        # Step 4: Store in DB
        trigger = UserTrigger(
            telegram_user_id=telegram_user_id,
            elfa_query_id=str(elfa_query_id),
            trigger_type=trigger_type,
            description=description,
            action_config=parsed_action_config,
            elfa_query_json=eql_json,
            status="active",
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        )
        db.add(trigger)
        db.commit()

        logger.info(f"Created trigger {elfa_query_id} for user {telegram_user_id}: {description}")

        return {
            "status": "success",
            "trigger_id": trigger.id,
            "elfa_query_id": elfa_query_id,
            "trigger_type": trigger_type,
            "description": description,
            "expires_in": "7 days",
            "message": f"Trigger created. I'll {'execute the trade' if trigger_type == 'auto_execute' else 'notify you'} when the condition is met.",
        }

    except Exception as e:
        logger.error(f"Error creating trigger: {e}", exc_info=True)
        db.rollback()
        return {"status": "error", "error": f"Failed to create trigger: {str(e)}"}
    finally:
        db.close()


@mcp.tool()
async def list_triggers(telegram_user_id: int) -> Dict[str, Any]:
    """
    List all triggers for a user.

    Args:
        telegram_user_id: The Telegram user ID

    Returns:
        List of triggers with their status
    """
    db = SessionLocal()
    try:
        triggers = (
            db.query(UserTrigger)
            .filter_by(telegram_user_id=telegram_user_id)
            .filter(UserTrigger.status.in_(["active", "triggered"]))
            .order_by(UserTrigger.created_at.desc())
            .all()
        )

        if not triggers:
            return {"status": "success", "triggers": [], "message": "No active triggers."}

        trigger_list = []
        for t in triggers:
            trigger_list.append({
                "id": t.id,
                "type": t.trigger_type,
                "description": t.description,
                "status": t.status,
                "created_at": t.created_at.isoformat() if t.created_at else None,
                "triggered_at": t.triggered_at.isoformat() if t.triggered_at else None,
                "expires_at": t.expires_at.isoformat() if t.expires_at else None,
            })

        return {
            "status": "success",
            "triggers": trigger_list,
            "count": len(trigger_list),
        }

    except Exception as e:
        logger.error(f"Error listing triggers: {e}", exc_info=True)
        return {"status": "error", "error": str(e)}
    finally:
        db.close()


@mcp.tool()
async def cancel_trigger(
    telegram_user_id: int,
    trigger_id: int,
) -> Dict[str, Any]:
    """
    Cancel an active trigger.

    Args:
        telegram_user_id: The Telegram user ID
        trigger_id: The trigger ID to cancel

    Returns:
        Cancellation result
    """
    db = SessionLocal()
    try:
        trigger = (
            db.query(UserTrigger)
            .filter_by(id=trigger_id, telegram_user_id=telegram_user_id)
            .first()
        )

        if not trigger:
            return {"status": "error", "error": "Trigger not found."}

        if trigger.status != "active":
            return {"status": "error", "error": f"Trigger is already {trigger.status}."}

        # Cancel on Elfa
        cancel_result = await _elfa_request("POST", f"/queries/{trigger.elfa_query_id}/cancel", {})
        if "error" in cancel_result:
            logger.warning(f"Elfa cancel failed for {trigger.elfa_query_id}: {cancel_result}")
            # Still mark as cancelled locally even if Elfa fails

        trigger.status = "cancelled"
        db.commit()

        logger.info(f"Cancelled trigger {trigger_id} (elfa: {trigger.elfa_query_id}) for user {telegram_user_id}")

        return {
            "status": "success",
            "message": f"Trigger cancelled: {trigger.description}",
        }

    except Exception as e:
        logger.error(f"Error cancelling trigger: {e}", exc_info=True)
        db.rollback()
        return {"status": "error", "error": str(e)}
    finally:
        db.close()


@mcp.tool()
async def get_trigger_status(
    telegram_user_id: int,
    trigger_id: int,
) -> Dict[str, Any]:
    """
    Get the current status of a specific trigger.

    Args:
        telegram_user_id: The Telegram user ID
        trigger_id: The trigger ID to check

    Returns:
        Trigger details and current status
    """
    db = SessionLocal()
    try:
        trigger = (
            db.query(UserTrigger)
            .filter_by(id=trigger_id, telegram_user_id=telegram_user_id)
            .first()
        )

        if not trigger:
            return {"status": "error", "error": "Trigger not found."}

        # Optionally poll Elfa for live status
        elfa_status = None
        if trigger.status == "active" and trigger.elfa_query_id:
            elfa_result = await _elfa_request("GET", f"/queries/{trigger.elfa_query_id}")
            if "error" not in elfa_result:
                elfa_status = elfa_result.get("status")

        return {
            "status": "success",
            "trigger": {
                "id": trigger.id,
                "type": trigger.trigger_type,
                "description": trigger.description,
                "status": trigger.status,
                "elfa_status": elfa_status,
                "created_at": trigger.created_at.isoformat() if trigger.created_at else None,
                "triggered_at": trigger.triggered_at.isoformat() if trigger.triggered_at else None,
                "expires_at": trigger.expires_at.isoformat() if trigger.expires_at else None,
                "action_config": trigger.action_config,
            },
        }

    except Exception as e:
        logger.error(f"Error getting trigger status: {e}", exc_info=True)
        return {"status": "error", "error": str(e)}
    finally:
        db.close()
