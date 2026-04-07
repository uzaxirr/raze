#!/usr/bin/env python3
"""
Price Alerts MCP Server
Manages price alert CRUD operations for the agent.
"""
import os
import sys
import logging
from pathlib import Path
from typing import Dict, Any
from decimal import Decimal
from datetime import datetime
from fastmcp import FastMCP
from dotenv import load_dotenv

# Load from project root
_root = Path(__file__).resolve().parent
while not (_root / '.env').exists() and _root != _root.parent:
    _root = _root.parent
load_dotenv(_root / '.env')

# Add parent paths for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from db.database import SessionLocal
from db.models import PriceAlert, UserProfile, UserPreferences, WatchedToken, WalletAlert, HeliusWebhookConfig

# Import Helius webhook helpers
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from shared.helius_webhooks import add_address_to_webhook, remove_address_from_webhook

# Import token registry for symbol resolution
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'transaction-executor'))
from token_registry import resolve_token, get_token_symbol

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

mcp = FastMCP(name="price-alerts")


@mcp.tool()
async def create_price_alert(
    telegram_user_id: int,
    token: str,
    target_price: float,
    condition: str
) -> Dict[str, Any]:
    """
    Create a new price alert for a user.

    Args:
        telegram_user_id: The Telegram user ID
        token: Token symbol (e.g., 'SOL', 'BONK') or mint address
        target_price: The price threshold (in USD)
        condition: 'above' or 'below'

    Returns:
        Created alert details or error
    """
    condition = condition.lower().strip()
    if condition not in ('above', 'below'):
        return {"status": "error", "error": "Condition must be 'above' or 'below'"}

    if target_price <= 0:
        return {"status": "error", "error": "Target price must be positive"}

    # Resolve token
    try:
        token_address = resolve_token(token)
        token_symbol = get_token_symbol(token_address) or token.upper()
    except ValueError as e:
        return {"status": "error", "error": str(e)}

    db = SessionLocal()
    try:
        # Check user exists
        user = db.query(UserProfile).filter_by(telegram_user_id=telegram_user_id).first()
        if not user:
            return {"status": "error", "error": "User not found. Please use /start first."}

        # Check active alert limit (max 10 per user)
        active_count = db.query(PriceAlert).filter_by(
            user_id=telegram_user_id,
            is_active=True
        ).count()
        if active_count >= 10:
            return {"status": "error", "error": "Maximum 10 active alerts allowed. Delete some first."}

        # Create alert
        alert = PriceAlert(
            user_id=telegram_user_id,
            token_address=token_address,
            token_symbol=token_symbol,
            target_price=Decimal(str(target_price)),
            condition=condition,
            is_active=True
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)

        logger.info(f"Created alert {alert.id} for user {telegram_user_id}: {token_symbol} {condition} ${target_price}")

        return {
            "status": "success",
            "alert": {
                "id": alert.id,
                "token": token_symbol,
                "target_price": float(alert.target_price),
                "condition": condition,
                "message": f"Alert created: Will notify when {token_symbol} goes {condition} ${target_price:.6g}"
            }
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating alert: {e}")
        return {"status": "error", "error": str(e)}
    finally:
        db.close()


@mcp.tool()
async def list_price_alerts(
    telegram_user_id: int,
    include_triggered: bool = False
) -> Dict[str, Any]:
    """
    List all price alerts for a user.

    Args:
        telegram_user_id: The Telegram user ID
        include_triggered: Whether to include already triggered alerts

    Returns:
        List of alerts
    """
    db = SessionLocal()
    try:
        query = db.query(PriceAlert).filter_by(user_id=telegram_user_id)
        if not include_triggered:
            query = query.filter_by(is_active=True)

        alerts = query.order_by(PriceAlert.created_at.desc()).all()

        return {
            "status": "success",
            "alerts": [
                {
                    "id": a.id,
                    "token": a.token_symbol,
                    "token_address": a.token_address,
                    "target_price": float(a.target_price),
                    "condition": a.condition,
                    "is_active": a.is_active,
                    "triggered_at": a.triggered_at.isoformat() if a.triggered_at else None,
                    "created_at": a.created_at.isoformat() if a.created_at else None
                }
                for a in alerts
            ],
            "count": len(alerts)
        }
    finally:
        db.close()


@mcp.tool()
async def delete_price_alert(
    telegram_user_id: int,
    alert_id: int
) -> Dict[str, Any]:
    """
    Delete a specific price alert.

    Args:
        telegram_user_id: The Telegram user ID (for verification)
        alert_id: The alert ID to delete

    Returns:
        Success or error status
    """
    db = SessionLocal()
    try:
        alert = db.query(PriceAlert).filter_by(
            id=alert_id,
            user_id=telegram_user_id
        ).first()

        if not alert:
            return {"status": "error", "error": "Alert not found or doesn't belong to you"}

        token_symbol = alert.token_symbol
        db.delete(alert)
        db.commit()

        logger.info(f"Deleted alert {alert_id} for user {telegram_user_id}")

        return {
            "status": "success",
            "message": f"Deleted alert for {token_symbol}"
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting alert: {e}")
        return {"status": "error", "error": str(e)}
    finally:
        db.close()


@mcp.tool()
async def delete_all_alerts(telegram_user_id: int) -> Dict[str, Any]:
    """
    Delete all active price alerts for a user.

    Args:
        telegram_user_id: The Telegram user ID

    Returns:
        Number of deleted alerts
    """
    db = SessionLocal()
    try:
        deleted = db.query(PriceAlert).filter_by(
            user_id=telegram_user_id,
            is_active=True
        ).delete()
        db.commit()

        logger.info(f"Deleted {deleted} alerts for user {telegram_user_id}")

        return {
            "status": "success",
            "deleted_count": deleted,
            "message": f"Deleted {deleted} active alert(s)"
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting alerts: {e}")
        return {"status": "error", "error": str(e)}
    finally:
        db.close()


# =============================================================================
# USER PREFERENCES TOOLS
# =============================================================================

VALID_PREFERENCES = {
    "tone": ["casual", "professional", "degen"],
    "verbosity": ["brief", "detailed", "technical"],
    "risk_tolerance": ["conservative", "moderate", "aggressive"],
    "experience_level": ["beginner", "intermediate", "expert"],
    "price_alert_style": ["simple", "detailed", "meme"],
}


@mcp.tool()
async def get_user_preferences(telegram_user_id: int) -> Dict[str, Any]:
    """
    Get a user's personalization preferences.

    Args:
        telegram_user_id: The Telegram user ID

    Returns:
        User preferences (tone, verbosity, risk_tolerance, experience_level, etc.)
    """
    db = SessionLocal()
    try:
        prefs = db.query(UserPreferences).filter_by(user_id=telegram_user_id).first()

        if not prefs:
            # Return defaults if no preferences set
            return {
                "status": "success",
                "preferences": {
                    "tone": "casual",
                    "verbosity": "brief",
                    "risk_tolerance": "moderate",
                    "experience_level": "intermediate",
                    "default_slippage": 0.5,
                    "favorite_tokens": [],
                    "price_alert_style": "simple",
                },
                "is_default": True
            }

        return {
            "status": "success",
            "preferences": {
                "tone": prefs.tone,
                "verbosity": prefs.verbosity,
                "risk_tolerance": prefs.risk_tolerance,
                "experience_level": prefs.experience_level,
                "default_slippage": prefs.default_slippage,
                "favorite_tokens": prefs.favorite_tokens or [],
                "price_alert_style": prefs.price_alert_style,
            },
            "is_default": False
        }
    finally:
        db.close()


@mcp.tool()
async def update_user_preference(
    telegram_user_id: int,
    preference: str,
    value: str
) -> Dict[str, Any]:
    """
    Update a user's preference setting.

    Args:
        telegram_user_id: The Telegram user ID
        preference: Which preference to update. Options:
            - tone: casual, professional, degen
            - verbosity: brief, detailed, technical
            - risk_tolerance: conservative, moderate, aggressive
            - experience_level: beginner, intermediate, expert
            - price_alert_style: simple, detailed, meme
        value: The new value for the preference

    Returns:
        Updated preference confirmation
    """
    preference = preference.lower().strip()
    value = value.lower().strip()

    # Validate preference name
    if preference not in VALID_PREFERENCES:
        return {
            "status": "error",
            "error": f"Invalid preference. Must be one of: {', '.join(VALID_PREFERENCES.keys())}"
        }

    # Validate preference value
    if value not in VALID_PREFERENCES[preference]:
        return {
            "status": "error",
            "error": f"Invalid value for {preference}. Must be one of: {', '.join(VALID_PREFERENCES[preference])}"
        }

    db = SessionLocal()
    try:
        # Check user exists
        user = db.query(UserProfile).filter_by(telegram_user_id=telegram_user_id).first()
        if not user:
            return {"status": "error", "error": "User not found. Please use /start first."}

        # Get or create preferences
        prefs = db.query(UserPreferences).filter_by(user_id=telegram_user_id).first()
        if not prefs:
            prefs = UserPreferences(user_id=telegram_user_id)
            db.add(prefs)

        # Update the preference
        setattr(prefs, preference, value)
        db.commit()

        logger.info(f"Updated preference for user {telegram_user_id}: {preference}={value}")

        return {
            "status": "success",
            "message": f"Updated {preference} to '{value}'",
            "preference": preference,
            "value": value
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating preference: {e}")
        return {"status": "error", "error": str(e)}
    finally:
        db.close()


@mcp.tool()
async def add_favorite_token(
    telegram_user_id: int,
    token: str
) -> Dict[str, Any]:
    """
    Add a token to user's favorites list.

    Args:
        telegram_user_id: The Telegram user ID
        token: Token symbol to add (e.g., 'SOL', 'BONK')

    Returns:
        Updated favorites list
    """
    token = token.upper().strip()

    db = SessionLocal()
    try:
        # Check user exists
        user = db.query(UserProfile).filter_by(telegram_user_id=telegram_user_id).first()
        if not user:
            return {"status": "error", "error": "User not found. Please use /start first."}

        # Get or create preferences
        prefs = db.query(UserPreferences).filter_by(user_id=telegram_user_id).first()
        if not prefs:
            prefs = UserPreferences(user_id=telegram_user_id, favorite_tokens=[])
            db.add(prefs)

        # Add token if not already in favorites
        current_favorites = prefs.favorite_tokens or []
        if token not in current_favorites:
            current_favorites.append(token)
            prefs.favorite_tokens = current_favorites
            db.commit()

        return {
            "status": "success",
            "message": f"Added {token} to favorites",
            "favorite_tokens": prefs.favorite_tokens
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error adding favorite token: {e}")
        return {"status": "error", "error": str(e)}
    finally:
        db.close()


# =============================================================================
# WATCHLIST TOOLS
# =============================================================================

@mcp.tool()
async def add_to_watchlist(
    telegram_user_id: int,
    token_address: str,
    token_symbol: str,
    token_name: str = None,
    price: float = None,
    market_cap: float = None,
    momentum_score: int = None,
    notes: str = None
) -> Dict[str, Any]:
    """
    Add a token to user's watchlist (typically from sniper workflow).

    Args:
        telegram_user_id: The Telegram user ID
        token_address: Token mint address
        token_symbol: Token symbol (e.g., 'DOGE2')
        token_name: Token full name (optional)
        price: Price at discovery time (optional)
        market_cap: Market cap at discovery time (optional)
        momentum_score: Momentum score from sniper (0-8, optional)
        notes: User notes about this token (optional)

    Returns:
        Created watchlist entry
    """
    db = SessionLocal()
    try:
        # Check user exists
        user = db.query(UserProfile).filter_by(telegram_user_id=telegram_user_id).first()
        if not user:
            return {"status": "error", "error": "User not found. Please use /start first."}

        # Check if already watching
        existing = db.query(WatchedToken).filter_by(
            user_id=telegram_user_id,
            token_address=token_address,
            status="watching"
        ).first()

        if existing:
            return {
                "status": "success",
                "message": f"Already watching {token_symbol}",
                "watchlist_entry": {
                    "id": existing.id,
                    "token": existing.token_symbol,
                    "discovered_at": existing.discovered_at.isoformat() if existing.discovered_at else None,
                }
            }

        # Check watchlist limit (max 20)
        watching_count = db.query(WatchedToken).filter_by(
            user_id=telegram_user_id,
            status="watching"
        ).count()
        if watching_count >= 20:
            return {"status": "error", "error": "Maximum 20 tokens in watchlist. Remove some first."}

        # Create entry
        entry = WatchedToken(
            user_id=telegram_user_id,
            token_address=token_address,
            token_symbol=token_symbol.upper(),
            token_name=token_name,
            discovered_price=Decimal(str(price)) if price else None,
            discovered_mc=Decimal(str(market_cap)) if market_cap else None,
            momentum_score=momentum_score,
            notes=notes,
            status="watching"
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)

        logger.info(f"Added {token_symbol} to watchlist for user {telegram_user_id}")

        return {
            "status": "success",
            "message": f"Added {token_symbol} to watchlist",
            "watchlist_entry": {
                "id": entry.id,
                "token": token_symbol,
                "address": token_address,
                "momentum_score": momentum_score,
                "discovered_price": float(price) if price else None,
                "discovered_mc": float(market_cap) if market_cap else None,
            }
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error adding to watchlist: {e}")
        return {"status": "error", "error": str(e)}
    finally:
        db.close()


@mcp.tool()
async def list_watchlist(
    telegram_user_id: int,
    status: str = "watching"
) -> Dict[str, Any]:
    """
    List user's watchlist tokens.

    Args:
        telegram_user_id: The Telegram user ID
        status: Filter by status - 'watching', 'bought', 'sold', 'removed', or 'all'

    Returns:
        List of watched tokens
    """
    db = SessionLocal()
    try:
        query = db.query(WatchedToken).filter_by(user_id=telegram_user_id)

        if status != "all":
            query = query.filter_by(status=status)

        entries = query.order_by(WatchedToken.discovered_at.desc()).all()

        return {
            "status": "success",
            "watchlist": [
                {
                    "id": e.id,
                    "token": e.token_symbol,
                    "name": e.token_name,
                    "address": e.token_address,
                    "momentum_score": e.momentum_score,
                    "discovered_price": float(e.discovered_price) if e.discovered_price else None,
                    "discovered_mc": float(e.discovered_mc) if e.discovered_mc else None,
                    "status": e.status,
                    "notes": e.notes,
                    "discovered_at": e.discovered_at.isoformat() if e.discovered_at else None,
                }
                for e in entries
            ],
            "count": len(entries)
        }
    finally:
        db.close()


@mcp.tool()
async def update_watchlist_status(
    telegram_user_id: int,
    watchlist_id: int,
    status: str,
    notes: str = None
) -> Dict[str, Any]:
    """
    Update the status of a watchlist entry.

    Args:
        telegram_user_id: The Telegram user ID
        watchlist_id: The watchlist entry ID
        status: New status - 'watching', 'bought', 'sold', 'removed'
        notes: Optional notes to add/update

    Returns:
        Updated entry details
    """
    valid_statuses = ["watching", "bought", "sold", "removed"]
    status = status.lower().strip()

    if status not in valid_statuses:
        return {
            "status": "error",
            "error": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        }

    db = SessionLocal()
    try:
        entry = db.query(WatchedToken).filter_by(
            id=watchlist_id,
            user_id=telegram_user_id
        ).first()

        if not entry:
            return {"status": "error", "error": "Watchlist entry not found or doesn't belong to you"}

        entry.status = status
        if notes is not None:
            entry.notes = notes

        db.commit()

        logger.info(f"Updated watchlist entry {watchlist_id} to status '{status}' for user {telegram_user_id}")

        return {
            "status": "success",
            "message": f"Updated {entry.token_symbol} to '{status}'",
            "entry": {
                "id": entry.id,
                "token": entry.token_symbol,
                "status": entry.status,
                "notes": entry.notes,
            }
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating watchlist: {e}")
        return {"status": "error", "error": str(e)}
    finally:
        db.close()


@mcp.tool()
async def remove_from_watchlist(
    telegram_user_id: int,
    watchlist_id: int
) -> Dict[str, Any]:
    """
    Remove a token from watchlist completely.

    Args:
        telegram_user_id: The Telegram user ID
        watchlist_id: The watchlist entry ID to remove

    Returns:
        Success or error status
    """
    db = SessionLocal()
    try:
        entry = db.query(WatchedToken).filter_by(
            id=watchlist_id,
            user_id=telegram_user_id
        ).first()

        if not entry:
            return {"status": "error", "error": "Watchlist entry not found or doesn't belong to you"}

        token_symbol = entry.token_symbol
        db.delete(entry)
        db.commit()

        logger.info(f"Removed {token_symbol} from watchlist for user {telegram_user_id}")

        return {
            "status": "success",
            "message": f"Removed {token_symbol} from watchlist"
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error removing from watchlist: {e}")
        return {"status": "error", "error": str(e)}
    finally:
        db.close()


def _validate_wallet_address(address: str) -> bool:
    """Validate Solana wallet address format."""
    import re
    # Base58 characters, 32-44 characters long
    if not re.match(r'^[1-9A-HJ-NP-Za-km-z]{32,44}$', address):
        return False
    return True


def _get_webhook_id() -> str | None:
    """Get the master Helius webhook ID from config."""
    db = SessionLocal()
    try:
        config = db.query(HeliusWebhookConfig).first()
        return config.webhook_id if config else None
    finally:
        db.close()


@mcp.tool()
async def create_wallet_alert(
    telegram_user_id: int,
    wallet_address: str,
    label: str = None
) -> Dict[str, Any]:
    """
    Create a wallet activity alert to get notified of transactions.

    Args:
        telegram_user_id: The Telegram user ID
        wallet_address: Solana wallet address to watch (e.g., 8MANgvzAp...)
        label: Optional nickname for the wallet (e.g., 'whale', 'vitalik')

    Returns:
        Created alert details or error
    """
    # Validate wallet address
    if not _validate_wallet_address(wallet_address):
        return {"status": "error", "error": "Invalid wallet address format"}

    db = SessionLocal()
    try:
        # Check user exists
        user = db.query(UserProfile).filter_by(telegram_user_id=telegram_user_id).first()
        if not user:
            return {"status": "error", "error": "User not found. Please use /start first."}

        # Check if already watching this wallet
        existing = db.query(WalletAlert).filter_by(
            user_id=telegram_user_id,
            watched_wallet=wallet_address,
            is_active=True
        ).first()
        if existing:
            return {
                "status": "success",
                "message": f"Already watching {wallet_address[:8]}...",
                "alert": {
                    "id": existing.id,
                    "wallet": existing.watched_wallet,
                    "label": existing.wallet_label
                }
            }

        # Check max 5 wallet alerts per user
        active_count = db.query(WalletAlert).filter_by(
            user_id=telegram_user_id,
            is_active=True
        ).count()
        if active_count >= 5:
            return {"status": "error", "error": "Max 5 wallet alerts allowed. Delete some first."}

        # Create alert
        alert = WalletAlert(
            user_id=telegram_user_id,
            watched_wallet=wallet_address,
            wallet_label=label,
            is_active=True
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)

        # Add address to Helius webhook
        webhook_id = _get_webhook_id()
        if webhook_id:
            success = await add_address_to_webhook(webhook_id, wallet_address)
            if not success:
                logger.warning(f"Failed to add {wallet_address[:8]}... to Helius webhook")

        logger.info(f"Created wallet alert {alert.id} for user {telegram_user_id}: {wallet_address[:8]}...")

        return {
            "status": "success",
            "alert": {
                "id": alert.id,
                "wallet": wallet_address,
                "label": label,
                "message": f"Watching {label or wallet_address[:8]}... for transactions"
            }
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating wallet alert: {e}")
        return {"status": "error", "error": str(e)}
    finally:
        db.close()


@mcp.tool()
async def list_wallet_alerts(telegram_user_id: int) -> Dict[str, Any]:
    """
    List all wallet alerts for a user.

    Args:
        telegram_user_id: The Telegram user ID

    Returns:
        List of wallet alerts
    """
    db = SessionLocal()
    try:
        alerts = db.query(WalletAlert).filter_by(
            user_id=telegram_user_id,
            is_active=True
        ).order_by(WalletAlert.created_at.desc()).all()

        return {
            "status": "success",
            "alerts": [
                {
                    "id": a.id,
                    "wallet": a.watched_wallet,
                    "label": a.wallet_label,
                    "created_at": a.created_at.isoformat() if a.created_at else None
                }
                for a in alerts
            ],
            "count": len(alerts)
        }
    finally:
        db.close()


@mcp.tool()
async def delete_wallet_alert(
    telegram_user_id: int,
    alert_id: int
) -> Dict[str, Any]:
    """
    Delete a wallet alert.

    Args:
        telegram_user_id: The Telegram user ID (for verification)
        alert_id: The alert ID to delete

    Returns:
        Success or error status
    """
    db = SessionLocal()
    try:
        alert = db.query(WalletAlert).filter_by(
            id=alert_id,
            user_id=telegram_user_id
        ).first()

        if not alert:
            return {"status": "error", "error": "Alert not found or doesn't belong to you"}

        wallet_address = alert.watched_wallet
        wallet_label = alert.wallet_label

        # Check if other users are watching this wallet
        other_watchers = db.query(WalletAlert).filter(
            WalletAlert.watched_wallet == wallet_address,
            WalletAlert.id != alert_id,
            WalletAlert.is_active == True
        ).count()

        db.delete(alert)
        db.commit()

        # Remove from Helius webhook only if no other users watching
        if other_watchers == 0:
            webhook_id = _get_webhook_id()
            if webhook_id:
                success = await remove_address_from_webhook(webhook_id, wallet_address)
                if not success:
                    logger.warning(f"Failed to remove {wallet_address[:8]}... from Helius webhook")

        logger.info(f"Deleted wallet alert {alert_id} for user {telegram_user_id}")

        return {
            "status": "success",
            "message": f"Stopped watching {wallet_label or wallet_address[:8]}..."
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting wallet alert: {e}")
        return {"status": "error", "error": str(e)}
    finally:
        db.close()


def main():
    mcp.run()


if __name__ == "__main__":
    main()
