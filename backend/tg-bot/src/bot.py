"""Telegram bot handlers and commands."""

import logging
import os
import sys
import time

# Add parent directory to path for db module import
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from agno.client import AgentOSClient
from db.database import SessionLocal
from db.models import UserProfile, PriceAlert, UserMCPServer
from agno.exceptions import RemoteServerUnavailableError
from agno.run.agent import RunContentEvent, RunCompletedEvent, ToolCallCompletedEvent
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.constants import ChatAction
from telegram.error import BadRequest
from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

from .api_logger import (
    log_api_call,
    log_streaming_api_call,
    APICallTracker,
    get_api_metrics,
    analyze_api_logs,
)
from .config import config
from .formatters import parse_markdown_to_entities, format_simple, truncate_message
from .privy import PrivyClient

logger = logging.getLogger(__name__)

# Pattern for embedded chart images: [CHART_IMAGE]base64data[/CHART_IMAGE]
import re
CHART_IMAGE_PATTERN = re.compile(r'\[CHART_IMAGE\](.*?)\[/CHART_IMAGE\]', re.DOTALL)
SIGN_TX_PATTERN = re.compile(r'\[SIGN_TX\](.*?)\[/SIGN_TX\]', re.DOTALL)

# Supported wallet apps for user preference
WALLET_APP_CYCLE = ["phantom", "backpack", "solflare", "jupiter"]


def extract_chart_image(text: str) -> tuple[str, str | None]:
    """
    Extract chart image data from response text.

    Returns:
        (clean_text, base64_image_data or None)
    """
    match = CHART_IMAGE_PATTERN.search(text)
    if match:
        base64_data = match.group(1).strip()
        clean_text = CHART_IMAGE_PATTERN.sub('', text).strip()
        return clean_text, base64_data
    return text, None


def strip_sign_tx_tags(text: str) -> str:
    """Strip any [SIGN_TX] tags from agent response — signing is handled by TMA now."""
    return SIGN_TX_PATTERN.sub('', text).strip()


PENDING_SWAP_PATTERN = re.compile(r'\[PENDING_SWAP\](.*?)\[/PENDING_SWAP\]', re.DOTALL)


def extract_pending_swap(text: str) -> tuple[str, dict | None]:
    """Extract pending swap data from agent response. Returns (clean_text, swap_params or None)."""
    match = PENDING_SWAP_PATTERN.search(text)
    if match:
        clean_text = PENDING_SWAP_PATTERN.sub('', text).strip()
        try:
            import json
            params = json.loads(match.group(1).strip())
            return clean_text, params
        except Exception:
            return clean_text, None
    return text, None


async def create_tma_signing_session(swap_params: dict, session_state: dict | None) -> str | None:
    """
    Store swap params via the TMA signing API and return the Mini App URL.
    """
    if not session_state or not swap_params:
        return None

    # Extract swap details from the agent's tool call results
    # The agent mentions amounts/tokens in its response — we store the params for the TMA to rebuild
    frontend_url = os.getenv("RAZE_FRONTEND_URL", "https://raze.fun")
    sign_secret = os.getenv("RAZE_SIGN_SECRET", "raze-dev-secret")
    bot_username = os.getenv("TELEGRAM_BOT_USERNAME", "razeaii_bot")

    try:
        import httpx
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{frontend_url}/api/tma/sign",
                json={
                    "walletAddress": session_state.get("external_wallet_address") or session_state.get("wallet_address"),
                    "signingMode": session_state.get("signing_mode", "external"),
                    "network": session_state.get("solana_network", "mainnet"),
                    "type": swap_params.get("type", "swap"),
                    "unsignedTransaction": swap_params.get("unsigned_transaction", ""),
                    "fromSymbol": swap_params.get("from_token", swap_params.get("fromSymbol", "")),
                    "toSymbol": swap_params.get("to_token", swap_params.get("toSymbol", "")),
                    "inputAmount": swap_params.get("input_amount", swap_params.get("amount", 0)),
                    "outputAmount": swap_params.get("output_amount", swap_params.get("outputAmount", 0)),
                    "priceImpact": swap_params.get("price_impact", swap_params.get("priceImpact", "")),
                    "toAddress": swap_params.get("to", swap_params.get("toAddress", "")),
                },
                headers={"x-sign-secret": sign_secret},
            )
            if resp.status_code == 200:
                session_id = resp.json().get("id")
                return f"https://t.me/{bot_username}/sign?startapp={session_id}"
    except Exception as e:
        logger.error(f"Failed to create TMA signing session: {e}")

    return None

# Beta notice banner
BETA_NOTICE = "⚠️ *BETA*: This bot is in active development. Some features may be unstable.\n\n"

# Global client instance
_client: AgentOSClient | None = None
_agent_id: str | None = None


def get_user_profile(telegram_user_id: int) -> UserProfile | None:
    """Get user profile from database by telegram user ID."""
    db = SessionLocal()
    try:
        return db.query(UserProfile).filter_by(telegram_user_id=telegram_user_id).first()
    finally:
        db.close()


def create_user_profile(
    telegram_user_id: int,
    telegram_username: str | None = None,
    wallet_address: str | None = None,
    wallet_id: str | None = None,
) -> UserProfile:
    """Create a new user profile in the database."""
    db = SessionLocal()
    try:
        user = UserProfile(
            telegram_user_id=telegram_user_id,
            telegram_username=telegram_username,
            wallet_address=wallet_address,
            wallet_id=wallet_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


def update_user_wallet(
    telegram_user_id: int,
    wallet_address: str,
    wallet_id: str,
) -> UserProfile | None:
    """Update user's wallet information."""
    db = SessionLocal()
    try:
        user = db.query(UserProfile).filter_by(telegram_user_id=telegram_user_id).first()
        if user:
            user.wallet_address = wallet_address
            user.wallet_id = wallet_id
            db.commit()
            db.refresh(user)
        return user
    finally:
        db.close()


def get_user_network(telegram_user_id: int) -> str:
    """Get user's Solana network preference (mainnet or devnet)."""
    db = SessionLocal()
    try:
        user = db.query(UserProfile).filter_by(telegram_user_id=telegram_user_id).first()
        if user and user.solana_network:
            return user.solana_network
        return "mainnet"  # Default
    finally:
        db.close()


def update_user_network(telegram_user_id: int, network: str) -> bool:
    """Update user's Solana network preference."""
    if network not in ("mainnet", "devnet"):
        return False
    db = SessionLocal()
    try:
        user = db.query(UserProfile).filter_by(telegram_user_id=telegram_user_id).first()
        if user:
            user.solana_network = network
            db.commit()
            return True
        return False
    finally:
        db.close()


def update_signing_mode(telegram_user_id: int, mode: str) -> bool:
    """Update user's signing mode (internal or external)."""
    if mode not in ("internal", "external"):
        return False
    db = SessionLocal()
    try:
        user = db.query(UserProfile).filter_by(telegram_user_id=telegram_user_id).first()
        if user:
            user.signing_mode = mode
            db.commit()
            return True
        return False
    finally:
        db.close()


def update_external_wallet(telegram_user_id: int, address: str) -> bool:
    """Update user's external wallet address."""
    db = SessionLocal()
    try:
        user = db.query(UserProfile).filter_by(telegram_user_id=telegram_user_id).first()
        if user:
            user.external_wallet_address = address
            db.commit()
            return True
        return False
    finally:
        db.close()


def update_wallet_app(telegram_user_id: int, app: str) -> bool:
    """Update user's preferred wallet app."""
    if app not in WALLET_APP_CYCLE:
        return False
    db = SessionLocal()
    try:
        user = db.query(UserProfile).filter_by(telegram_user_id=telegram_user_id).first()
        if user:
            user.preferred_wallet_app = app
            db.commit()
            return True
        return False
    finally:
        db.close()


async def get_client_and_agent() -> tuple[AgentOSClient, str]:
    """Get or create the AgentOS client and discover agent ID."""
    global _client, _agent_id

    if _client is None:
        _client = AgentOSClient(base_url=config.AGENTOS_BASE_URL, timeout=180.0)

    if _agent_id is None:
        with APICallTracker("get_config") as tracker:
            try:
                os_config = await _client.aget_config()
                tracker.set_response({"agents_count": len(os_config.agents) if os_config.agents else 0})

                if os_config.agents:
                    _agent_id = os_config.agents[0].id
                    logger.info(f"Using agent: {_agent_id}")
                else:
                    raise RuntimeError("No agents found in AgentOS")
            except Exception as e:
                tracker.error = e
                raise

    return _client, _agent_id


def get_session_id(user_id: int, context: ContextTypes.DEFAULT_TYPE) -> str:
    """Get or create session ID for a user."""
    custom_session = context.user_data.get("session_id")
    if custom_session:
        return custom_session
    return f"tg_user_{user_id}"


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /start command - create wallet for new users, welcome back existing users."""
    user = update.effective_user
    user_id = str(user.id)
    session_id = f"tg_user_{user.id}"

    # Extract referral code from /start ref_XXXX or /start waitlist
    start_param = ""
    if context.args and len(context.args) > 0:
        start_param = context.args[0]
    if start_param.startswith("ref_"):
        context.user_data["referral_code"] = start_param[4:]  # strip "ref_" prefix

    # Waitlist gate for /start
    import os
    waitlist_enabled = os.getenv("WAITLIST_ENABLED", "false").lower() == "true"
    if waitlist_enabled:
        from .waitlist import check_access, join_waitlist, get_waitlist_count, get_approved_count
        access = check_access(user.id)

        if access["access"] in ("new", "waiting", "taste", "limited"):
            # Join waitlist if new
            if access["access"] == "new":
                ref_code = context.user_data.get("referral_code")
                entry = join_waitlist(
                    telegram_user_id=user.id,
                    telegram_username=user.username,
                    first_name=user.first_name,
                    referred_by_code=ref_code,
                    joined_via="referral" if ref_code else "direct",
                )
            else:
                from .waitlist import get_waitlist_entry
                entry = get_waitlist_entry(user.id)

            total = get_waitlist_count()
            await update.message.reply_text(
                f"yo. raze here — your future crypto assistant. brutally honest, actually useful.\n\n"
                f"you're on the waitlist — #{entry.position} of {total}\n\n"
                f"share your link to move up:\n"
                f"raze.fun/ref/{entry.referral_code}\n\n"
                f"5 referrals = instant access. every referral = +50 spots.\n\n"
                f"you can chat with me while you wait — 5 free msgs/day 🫡"
            )
            return

        if access["access"] == "banned":
            return

        # access == "full" — fall through to normal /start flow

    # Show typing indicator while we set things up
    await update.message.chat.send_action(ChatAction.TYPING)

    try:
        client, agent_id = await get_client_and_agent()

        # Check if user exists in database
        user_profile = get_user_profile(user.id)

        if user_profile and user_profile.wallet_address:
            # User already has a wallet - welcome them back
            welcome_message = (
                f"welcome back {user.first_name}.\n\n"
                f"wallet: `{user_profile.wallet_address}`\n\n"
                "use /wallet to connect your own wallet if you wanna sign transactions yourself\n\n"
                "what do you need?"
            )
        else:
            # New user or no wallet - create one via Privy
            privy = PrivyClient()
            # Use telegram user ID as idempotency key to prevent duplicate wallets
            wallet = await privy.create_solana_wallet(idempotency_key=f"tg_{user.id}")

            # Create or update user profile in database
            if user_profile:
                update_user_wallet(user.id, wallet["address"], wallet["id"])
            else:
                create_user_profile(
                    telegram_user_id=user.id,
                    telegram_username=user.username or user.first_name,
                    wallet_address=wallet["address"],
                    wallet_id=wallet["id"],
                )

            # Let the agent handle onboarding with its personality
            # [FIRST_TIME_USER] tag triggers the guided experience in agent_prompt.py
            profile_message = f"[FIRST_TIME_USER] {user.username or user.first_name} just joined! Wallet: {wallet['address']}"

            agent_response = ""
            with APICallTracker("wallet_registration", str(user.id)) as tracker:
                tracker.set_request(
                    message=profile_message,
                    wallet_address=wallet["address"]
                )
                async for event in client.run_agent_stream(
                    agent_id=agent_id,
                    message=profile_message,
                    user_id=user_id,
                    session_id=session_id,
                    session_state={
                        "wallet_address": wallet["address"],
                        "wallet_id": wallet["id"],
                        "telegram_username": user.username or user.first_name,
                        "solana_network": "mainnet",
                        "created_at": int(time.time()),
                        "signing_mode": "internal",
                        "external_wallet_address": None,
                        "preferred_wallet_app": "phantom",
                    },
                ):
                    if isinstance(event, RunContentEvent):
                        agent_response += event.content
                tracker.set_response({"wallet_registered": True})

            # Use agent's response as the welcome message — Raze handles the personality
            welcome_message = agent_response.strip() if agent_response.strip() else (
                f"yo. made you a wallet: `{wallet['address']}`\n\n"
                "you cool with me handling transactions, or wanna sign yourself in phantom/backpack/jupiter?\n\n"
                "anyway — memecoins or defi, what's your poison?"
            )
            logger.info(f"Created wallet for user {user.id}: {wallet['address']}")

    except ValueError as e:
        # Privy not configured
        logger.error(f"Privy configuration error: {e}")
        welcome_message = (
            f"Hello {user.first_name}! I'm the Solana MCP Agent.\n\n"
            "Wallet creation is not available at the moment.\n"
            "Please contact the administrator.\n\n"
            "Commands:\n"
            "/clear - Reset conversation\n"
            "/help - Show help"
        )
    except Exception as e:
        logger.exception(f"Failed to handle /start: {e}")
        welcome_message = (
            f"Hello {user.first_name}! I'm the Solana MCP Agent.\n\n"
            "There was an issue setting up. Please try /start again.\n\n"
            "Commands:\n"
            "/clear - Reset conversation\n"
            "/help - Show help"
        )

    # Use entities for formatting
    full_message = BETA_NOTICE + welcome_message
    parsed = parse_markdown_to_entities(full_message)
    await update.message.reply_text(parsed.text, entities=parsed.entities if parsed.entities else None)


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /help command."""
    help_text = (
        "Solana MCP Agent Help\n\n"
        "Just send me any question or request about Solana, and I'll help you!\n\n"
        "Examples:\n"
        "- 'What is my balance?'\n"
        "- 'Show me recent transactions'\n"
        "- 'Tell me about SOL token'\n"
        "- 'Alert me when SOL goes above $200'\n"
        "- 'Notify me if BONK drops below $0.00001'\n\n"
        "Commands:\n"
        "/start - Create wallet / Welcome\n"
        "/wallet - View your wallet address\n"
        "/network - Switch between mainnet/devnet\n"
        "/alerts - View active price alerts\n"
        "/clear - Reset conversation (start fresh)\n"
        "/apistats - View API call statistics\n"
        "/help - Show this help\n\n"
        "MCP Servers (extend my capabilities):\n"
        "/addmcp <name> <url> - Add MCP server\n"
        "/listmcp - List your MCP servers\n"
        "/removemcp <name> - Remove MCP server\n"
        "/togglemcp <name> - Enable/disable server"
    )
    await update.message.reply_text(help_text)


async def clear_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /clear command - reset conversation history but preserve wallet."""
    user_id = update.effective_user.id
    # Note: We create a new session ID for conversation history,
    # but the wallet is stored in the original session (tg_user_{user_id})
    new_session_id = f"tg_user_{user_id}_{int(time.time())}"
    context.user_data["session_id"] = new_session_id
    await update.message.reply_text(
        "Conversation cleared! Starting fresh.\n"
        "Your wallet is still linked to your account.\n"
        "Send me a message to begin a new conversation."
    )


async def wallet_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /wallet command - show wallet info, signing mode, and inline controls."""
    user = update.effective_user

    await update.message.chat.send_action(ChatAction.TYPING)

    try:
        user_profile = get_user_profile(user.id)

        if not user_profile or not user_profile.wallet_address:
            await update.message.reply_text(
                "no wallet found. use /start to get set up."
            )
            return

        signing_mode = user_profile.signing_mode or "internal"
        external_addr = user_profile.external_wallet_address
        wallet_app = user_profile.preferred_wallet_app or "phantom"

        # Build wallet info text
        lines = [
            "your wallets\n",
            f"internal (privy): `{user_profile.wallet_address}`",
            f"external: {f'`{external_addr}`' if external_addr else 'not connected'}",
            f"\nactive mode: **{signing_mode}** {'(raze signs for you)' if signing_mode == 'internal' else '(you sign in ' + wallet_app + ')'}",
        ]
        response = "\n".join(lines)

        # Build inline keyboard
        keyboard = []

        # Mode toggle row
        if signing_mode == "internal":
            keyboard.append([
                InlineKeyboardButton("switch to external", callback_data="wallet_mode_external"),
            ])
        else:
            keyboard.append([
                InlineKeyboardButton("switch to internal", callback_data="wallet_mode_internal"),
            ])

        # Connect external wallet button (if none connected)
        if not external_addr:
            keyboard.append([
                InlineKeyboardButton("connect external wallet", callback_data="wallet_connect"),
            ])

        # Wallet app selector
        keyboard.append([
            InlineKeyboardButton(
                f"wallet app: {wallet_app}",
                callback_data=f"wallet_app_{wallet_app}",
            ),
        ])

        reply_markup = InlineKeyboardMarkup(keyboard)
        parsed = parse_markdown_to_entities(response)
        await update.message.reply_text(
            parsed.text,
            entities=parsed.entities if parsed.entities else None,
            reply_markup=reply_markup,
        )

    except Exception as e:
        logger.exception(f"Wallet command error: {e}")
        await update.message.reply_text("couldn't load wallet info. try again.")



async def alerts_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /alerts command - show user's active price alerts."""
    user = update.effective_user

    await update.message.chat.send_action(ChatAction.TYPING)

    db = SessionLocal()
    try:
        alerts = db.query(PriceAlert).filter_by(
            user_id=user.id,
            is_active=True
        ).order_by(PriceAlert.created_at.desc()).all()

        if not alerts:
            response = (
                "No active price alerts.\n\n"
                "To create one, just tell me something like:\n"
                "- 'Alert me when SOL goes above $200'\n"
                "- 'Notify me if BONK drops below $0.00001'"
            )
        else:
            lines = ["Your Active Price Alerts:\n"]
            for i, alert in enumerate(alerts, 1):
                price_str = f"${float(alert.target_price):,.6g}"
                lines.append(
                    f"{i}. {alert.token_symbol} {alert.condition} {price_str}"
                )
            lines.append("\nTo delete an alert, tell me which one to remove.")
            response = "\n".join(lines)
    finally:
        db.close()

    await update.message.reply_text(response)


async def apistats_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /apistats command - show API call statistics (admin only)."""
    user = update.effective_user

    # Add your admin user IDs here
    ADMIN_USER_IDS = [config.ADMIN_TELEGRAM_ID] if hasattr(config, 'ADMIN_TELEGRAM_ID') else []

    # Check if user is admin (you can modify this check)
    # For now, we'll allow anyone to view their own stats
    is_admin = str(user.id) in map(str, ADMIN_USER_IDS) if ADMIN_USER_IDS else True

    await update.message.chat.send_action(ChatAction.TYPING)

    try:
        # Get API statistics from the last 24 hours
        stats = analyze_api_logs(hours=24)

        if not stats["total_calls"]:
            await update.message.reply_text("No API calls recorded in the last 24 hours.")
            return

        lines = ["📊 *API Statistics (Last 24 Hours)*\n"]

        # Overall stats
        lines.append(f"Total Calls: {stats['total_calls']}")
        lines.append(f"Failed Calls: {stats['failed_calls']}")
        lines.append(f"Slow Calls (>5s): {stats['slow_calls']}")

        if stats['total_calls'] > 0:
            error_rate = (stats['failed_calls'] / stats['total_calls']) * 100
            lines.append(f"Error Rate: {error_rate:.1f}%")

        # Operation breakdown
        if stats["operations"]:
            lines.append("\n*By Operation:*")
            for op, data in sorted(stats["operations"].items(), key=lambda x: x[1]["count"], reverse=True)[:5]:
                avg_duration = data.get("average_duration", 0)
                lines.append(f"• {op}: {data['count']} calls, avg {avg_duration:.2f}s")

        # User activity (for admin)
        if is_admin and stats["users"]:
            lines.append("\n*Top Users:*")
            sorted_users = sorted(stats["users"].items(), key=lambda x: x[1]["count"], reverse=True)[:5]
            for user_id, data in sorted_users:
                avg_duration = data.get("average_duration", 0)
                lines.append(f"• User {user_id}: {data['count']} calls, avg {avg_duration:.2f}s")

        # Recent errors
        if stats["errors"] and len(stats["errors"]) > 0:
            lines.append("\n*Recent Errors:*")
            for error in stats["errors"][-3:]:  # Show last 3 errors
                error_type = error["error"].get("type", "Unknown")
                operation = error["operation"]
                lines.append(f"• {operation}: {error_type}")

        response = "\n".join(lines)
        parsed = parse_markdown_to_entities(response)
        await update.message.reply_text(parsed.text, entities=parsed.entities if parsed.entities else None)

    except Exception as e:
        logger.exception(f"Error generating API stats: {e}")
        await update.message.reply_text("Unable to generate API statistics.")


# =============================================================================
# MCP SERVER COMMANDS
# =============================================================================

MAX_USER_MCP_SERVERS = 3


async def addmcp_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /addmcp command - add a custom MCP server."""
    user = update.effective_user
    args = context.args

    if not args or len(args) < 2:
        await update.message.reply_text(
            "Usage: /addmcp <name> <url>\n\n"
            "Example:\n"
            "/addmcp linear https://mcp.linear.app/mcp\n"
            "/addmcp github https://mcp.github.com/sse"
        )
        return

    name = args[0].lower().strip()
    url = args[1].strip()

    await update.message.chat.send_action(ChatAction.TYPING)

    # Validate name
    if len(name) < 2 or len(name) > 64:
        await update.message.reply_text("Name must be 2-64 characters.")
        return

    # Validate URL
    if not url.startswith(("http://", "https://")):
        await update.message.reply_text("URL must start with http:// or https://")
        return

    db = SessionLocal()
    try:
        # Check user exists
        user_profile = db.query(UserProfile).filter_by(telegram_user_id=user.id).first()
        if not user_profile:
            await update.message.reply_text("Please use /start first to set up your account.")
            return

        # Check limit
        current_count = db.query(UserMCPServer).filter_by(user_id=user.id).count()
        if current_count >= MAX_USER_MCP_SERVERS:
            await update.message.reply_text(
                f"Max {MAX_USER_MCP_SERVERS} MCP servers allowed. Use /removemcp to remove one first."
            )
            return

        # Check duplicate
        existing = db.query(UserMCPServer).filter_by(user_id=user.id, name=name).first()
        if existing:
            await update.message.reply_text(f"MCP server '{name}' already exists. Use /removemcp to remove it first.")
            return

        # Use agent to add the MCP server (handles OAuth detection)
        client, agent_id = await get_client_and_agent()
        session_id = get_session_id(user.id, context)

        # Send request through agent
        response_text = ""
        auth_url = None

        async for event in client.run_agent_stream(
            agent_id=agent_id,
            message=f"add mcp server {name} {url}",
            user_id=str(user.id),
            session_id=session_id,
            session_state={
                "wallet_address": user_profile.wallet_address,
                "wallet_id": user_profile.wallet_id,
                "telegram_username": user_profile.telegram_username,
                "telegram_user_id": user.id,
                "solana_network": user_profile.solana_network or "mainnet",
            },
        ):
            if isinstance(event, RunContentEvent) and event.content:
                response_text += event.content
            elif isinstance(event, RunCompletedEvent):
                break

        # Check if response contains an OAuth URL
        if "oauth_required" in response_text.lower() or "authorization" in response_text.lower():
            # Try to extract URL from response
            import re
            url_match = re.search(r'https://[^\s<>"\']+', response_text)
            if url_match:
                auth_url = url_match.group(0)

        if auth_url:
            # Send message with clickable OAuth button
            keyboard = [[InlineKeyboardButton(f"Authorize {name}", url=auth_url)]]
            reply_markup = InlineKeyboardMarkup(keyboard)
            await update.message.reply_text(
                f"{name} needs authorization. Tap below to connect:",
                reply_markup=reply_markup
            )
        else:
            await update.message.reply_text(response_text or f"Added MCP server '{name}'")

    except Exception as e:
        logger.exception(f"Error adding MCP server: {e}")
        await update.message.reply_text("Failed to add MCP server. Please try again.")
    finally:
        db.close()


async def listmcp_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /listmcp command - list user's MCP servers."""
    user = update.effective_user

    await update.message.chat.send_action(ChatAction.TYPING)

    db = SessionLocal()
    try:
        servers = db.query(UserMCPServer).filter_by(user_id=user.id).order_by(
            UserMCPServer.created_at.desc()
        ).all()

        if not servers:
            await update.message.reply_text(
                "No MCP servers configured.\n\n"
                "Add one with:\n"
                "/addmcp <name> <url>"
            )
            return

        lines = [f"Your MCP Servers ({len(servers)}/{MAX_USER_MCP_SERVERS}):\n"]
        for s in servers:
            status = "active" if s.is_active else "disabled"
            auth = s.auth_type or "none"
            lines.append(f"- {s.name} ({status}, auth: {auth})")
            lines.append(f"  {s.url[:50]}...")

        lines.append("\nCommands:")
        lines.append("/removemcp <name> - Remove server")
        lines.append("/togglemcp <name> - Enable/disable")

        await update.message.reply_text("\n".join(lines))
    finally:
        db.close()


async def removemcp_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /removemcp command - remove an MCP server."""
    user = update.effective_user
    args = context.args

    if not args:
        await update.message.reply_text("Usage: /removemcp <name>")
        return

    name = args[0].lower().strip()

    await update.message.chat.send_action(ChatAction.TYPING)

    db = SessionLocal()
    try:
        server = db.query(UserMCPServer).filter_by(user_id=user.id, name=name).first()

        if not server:
            await update.message.reply_text(f"MCP server '{name}' not found.")
            return

        db.delete(server)
        db.commit()

        await update.message.reply_text(f"Removed MCP server '{name}'")
        logger.info(f"User {user.id} removed MCP server '{name}'")
    except Exception as e:
        db.rollback()
        logger.exception(f"Error removing MCP server: {e}")
        await update.message.reply_text("Failed to remove MCP server.")
    finally:
        db.close()


async def togglemcp_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /togglemcp command - enable/disable an MCP server."""
    user = update.effective_user
    args = context.args

    if not args:
        await update.message.reply_text("Usage: /togglemcp <name>")
        return

    name = args[0].lower().strip()

    await update.message.chat.send_action(ChatAction.TYPING)

    db = SessionLocal()
    try:
        server = db.query(UserMCPServer).filter_by(user_id=user.id, name=name).first()

        if not server:
            await update.message.reply_text(f"MCP server '{name}' not found.")
            return

        server.is_active = not server.is_active
        new_status = "enabled" if server.is_active else "disabled"
        db.commit()

        await update.message.reply_text(f"MCP server '{name}' is now {new_status}")
        logger.info(f"User {user.id} toggled MCP server '{name}' to {new_status}")
    except Exception as e:
        db.rollback()
        logger.exception(f"Error toggling MCP server: {e}")
        await update.message.reply_text("Failed to toggle MCP server.")
    finally:
        db.close()


# =============================================================================
# NETWORK SWITCHING COMMANDS
# =============================================================================

async def network_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /network command - switch between mainnet and devnet."""
    user = update.effective_user
    args = context.args

    # Check if user exists
    user_profile = get_user_profile(user.id)
    if not user_profile:
        await update.message.reply_text("Please use /start first to set up your account.")
        return

    current_network = get_user_network(user.id)

    # If argument provided, switch directly
    if args:
        new_network = args[0].lower().strip()
        if new_network not in ("mainnet", "devnet"):
            await update.message.reply_text(
                "Invalid network. Use:\n"
                "/network mainnet\n"
                "/network devnet"
            )
            return

        if new_network == current_network:
            await update.message.reply_text(f"You're already on {current_network}.")
            return

        if update_user_network(user.id, new_network):
            await update.message.reply_text(f"Switched to {new_network}.")
            logger.info(f"User {user.id} switched network to {new_network}")
        else:
            await update.message.reply_text("Failed to switch network. Please try again.")
        return

    # No argument - show current network with toggle buttons
    other_network = "devnet" if current_network == "mainnet" else "mainnet"

    keyboard = [
        [
            InlineKeyboardButton(
                f"{'✓ ' if current_network == 'mainnet' else ''}Mainnet",
                callback_data="network_mainnet"
            ),
            InlineKeyboardButton(
                f"{'✓ ' if current_network == 'devnet' else ''}Devnet",
                callback_data="network_devnet"
            ),
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        f"Current network: {current_network}\n\n"
        "Select a network:",
        reply_markup=reply_markup
    )


async def network_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle network selection button clicks."""
    query = update.callback_query

    user = query.from_user
    data = query.data

    logger.info(f"Network callback received: user={user.id}, data={data}")

    if not data or not data.startswith("network_"):
        await query.answer()
        return

    new_network = data.replace("network_", "")
    if new_network not in ("mainnet", "devnet"):
        await query.answer("Invalid network selection")
        return

    try:
        current_network = get_user_network(user.id)
        logger.info(f"User {user.id} current network: {current_network}, requested: {new_network}")

        if new_network == current_network:
            await query.answer(f"Already on {current_network}")
            return

        if update_user_network(user.id, new_network):
            # Update button display
            keyboard = [
                [
                    InlineKeyboardButton(
                        f"{'✓ ' if new_network == 'mainnet' else ''}Mainnet",
                        callback_data="network_mainnet"
                    ),
                    InlineKeyboardButton(
                        f"{'✓ ' if new_network == 'devnet' else ''}Devnet",
                        callback_data="network_devnet"
                    ),
                ]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)

            await query.answer(f"Switched to {new_network}")
            await query.edit_message_text(
                f"Current network: {new_network}\n\n"
                "Select a network:",
                reply_markup=reply_markup
            )
            logger.info(f"User {user.id} switched network to {new_network}")
        else:
            await query.answer("Failed to switch network")
            logger.error(f"Failed to update network for user {user.id}")
    except Exception as e:
        logger.exception(f"Error in network_callback for user {user.id}: {e}")
        await query.answer("Error switching network")
        try:
            await query.edit_message_text("An error occurred. Please try /network again.")
        except Exception:
            pass


def _validate_solana_address(address: str) -> bool:
    """Validate a Solana address (base58, 32-44 chars)."""
    if not 32 <= len(address) <= 44:
        return False
    base58_chars = set("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz")
    return all(c in base58_chars for c in address)


def _build_wallet_keyboard(user_profile) -> InlineKeyboardMarkup:
    """Build the inline keyboard for /wallet display."""
    signing_mode = user_profile.signing_mode or "internal"
    external_addr = user_profile.external_wallet_address
    wallet_app = user_profile.preferred_wallet_app or "phantom"

    keyboard = []
    if signing_mode == "internal":
        keyboard.append([InlineKeyboardButton("switch to external", callback_data="wallet_mode_external")])
    else:
        keyboard.append([InlineKeyboardButton("switch to internal", callback_data="wallet_mode_internal")])

    if not external_addr:
        keyboard.append([InlineKeyboardButton("connect external wallet", callback_data="wallet_connect")])

    keyboard.append([InlineKeyboardButton(f"wallet app: {wallet_app}", callback_data=f"wallet_app_{wallet_app}")])
    return InlineKeyboardMarkup(keyboard)


async def wallet_mode_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle signing mode toggle button clicks."""
    query = update.callback_query
    user = query.from_user
    data = query.data  # wallet_mode_internal or wallet_mode_external

    new_mode = data.replace("wallet_mode_", "")
    if new_mode not in ("internal", "external"):
        await query.answer("invalid mode")
        return

    # If switching to external, check that an external wallet is connected
    if new_mode == "external":
        user_profile = get_user_profile(user.id)
        if not user_profile or not user_profile.external_wallet_address:
            await query.answer("connect an external wallet first")
            return

    if update_signing_mode(user.id, new_mode):
        user_profile = get_user_profile(user.id)
        wallet_app = user_profile.preferred_wallet_app or "phantom"
        external_addr = user_profile.external_wallet_address

        lines = [
            "your wallets\n",
            f"internal (privy): `{user_profile.wallet_address}`",
            f"external: {f'`{external_addr}`' if external_addr else 'not connected'}",
            f"\nactive mode: **{new_mode}** {'(raze signs for you)' if new_mode == 'internal' else '(you sign in ' + wallet_app + ')'}",
        ]
        response = "\n".join(lines)
        parsed = parse_markdown_to_entities(response)

        await query.answer(f"switched to {new_mode}")
        await query.edit_message_text(
            parsed.text,
            entities=parsed.entities if parsed.entities else None,
            reply_markup=_build_wallet_keyboard(user_profile),
        )
        logger.info(f"User {user.id} switched signing mode to {new_mode}")
    else:
        await query.answer("failed to switch mode")


async def wallet_connect_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle 'connect external wallet' button click."""
    query = update.callback_query
    user = query.from_user

    context.user_data["awaiting_external_wallet"] = True
    await query.answer()
    await query.edit_message_text(
        "paste your solana wallet address below.\n"
        "this is the wallet you'll sign transactions with (phantom, backpack, jupiter, solflare, etc)."
    )
    logger.info(f"User {user.id} initiated external wallet connection")


async def wallet_app_callback(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle wallet app cycle button click."""
    query = update.callback_query
    user = query.from_user
    data = query.data  # wallet_app_phantom, wallet_app_backpack, wallet_app_solflare

    current_app = data.replace("wallet_app_", "")
    if current_app not in WALLET_APP_CYCLE:
        current_app = "phantom"

    # Cycle to next app
    idx = WALLET_APP_CYCLE.index(current_app)
    next_app = WALLET_APP_CYCLE[(idx + 1) % len(WALLET_APP_CYCLE)]

    if update_wallet_app(user.id, next_app):
        user_profile = get_user_profile(user.id)
        signing_mode = user_profile.signing_mode or "internal"
        external_addr = user_profile.external_wallet_address

        lines = [
            "your wallets\n",
            f"internal (privy): `{user_profile.wallet_address}`",
            f"external: {f'`{external_addr}`' if external_addr else 'not connected'}",
            f"\nactive mode: **{signing_mode}** {'(raze signs for you)' if signing_mode == 'internal' else '(you sign in ' + next_app + ')'}",
        ]
        response = "\n".join(lines)
        parsed = parse_markdown_to_entities(response)

        await query.answer(f"wallet app: {next_app}")
        await query.edit_message_text(
            parsed.text,
            entities=parsed.entities if parsed.entities else None,
            reply_markup=_build_wallet_keyboard(user_profile),
        )
        logger.info(f"User {user.id} changed wallet app to {next_app}")
    else:
        await query.answer("failed to change wallet app")


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle incoming text messages."""
    message_text = update.message.text
    user_id = update.effective_user.id
    session_id = get_session_id(user_id, context)

    # ── Waitlist gate ──
    from .waitlist import check_access, join_waitlist, increment_message_count, get_waitlist_count, get_approved_count
    import os
    waitlist_enabled = os.getenv("WAITLIST_ENABLED", "false").lower() == "true"

    if waitlist_enabled:
        access = check_access(user_id)

        if access["access"] == "new":
            # Auto-join waitlist
            user = update.effective_user
            ref_code = context.user_data.get("referral_code")  # set by /start handler
            entry = join_waitlist(
                telegram_user_id=user_id,
                telegram_username=user.username,
                first_name=user.first_name,
                referred_by_code=ref_code,
                joined_via="referral" if ref_code else "direct",
            )
            total = get_waitlist_count()
            approved = get_approved_count()
            # Multi-bubble onboarding — feels like a real conversation
            import asyncio as _aio

            await update.message.reply_text(
                f"yo. raze here — your future crypto assistant. brutally honest, actually useful.\n\n"
                f"you're on the waitlist — #{entry.position} of {total}\n\n"
                f"share your link to move up:\n"
                f"raze.fun/ref/{entry.referral_code}\n\n"
                f"5 referrals = instant access. every referral = +50 spots."
            )

            await _aio.sleep(1.5)
            await update.message.chat.send_action(ChatAction.TYPING)
            await _aio.sleep(1.5)

            await update.message.reply_text(
                "oh btw drop your email so i can ping you when you're off the waitlist. telegram notifs are mid"
            )
            context.user_data["awaiting_email"] = True
            return

        if access["access"] == "banned":
            return  # silently ignore

        if access["access"] == "limited":
            entry = access.get("entry")
            code = entry.referral_code if entry else "???"
            await update.message.reply_text(
                f"you've hit your daily limit — 5 free msgs/day while on the waitlist.\n\n"
                f"share your link for instant access:\n"
                f"raze.fun/ref/{code}\n\n"
                f"or wait til tomorrow. your call 💀"
            )
            return

        if access["access"] == "taste":
            # Increment message counter
            increment_message_count(user_id)

            # Check if they're trying a blocked action
            blocked_keywords = ["alert", "watch", "snipe"]
            if any(kw in message_text.lower() for kw in blocked_keywords):
                entry = access.get("entry")
                code = entry.referral_code if entry else "???"
                await update.message.reply_text(
                    f"that's a pro move. you're still on the waitlist tho.\n\n"
                    f"share your link to skip the line:\n"
                    f"raze.fun/ref/{code}"
                )
                return

            # Check if the message is an email — save it silently
            import re as _email_re
            if _email_re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', message_text.strip()):
                from .waitlist import set_email
                set_email(user_id, message_text.strip())
                # Don't return — let it go through to bouncer so it can acknowledge

            # Route to bouncer agent (Raze personality, secretly evaluating)
            from .waitlist import get_waitlist_entry, set_bouncer_remarks
            entry = get_waitlist_entry(user_id)

            await update.message.chat.send_action(ChatAction.TYPING)
            bot_message = await update.message.reply_text("Thinking...")

            try:
                client, _ = await get_client_and_agent()
                bouncer_session_id = f"bouncer_{user_id}"
                msg_time = update.message.date.strftime("%Y-%m-%d %H:%M:%S UTC") if update.message.date else None

                accumulated_text = ""
                import time as _time
                last_update_time = _time.time()

                async for event in client.run_agent_stream(
                    agent_id="bouncer",
                    message=message_text,
                    user_id=str(user_id),
                    session_id=bouncer_session_id,
                    session_state={
                        "telegram_username": update.effective_user.username or update.effective_user.first_name,
                        "telegram_user_id": user_id,
                        "position": entry.position if entry else 0,
                        "referral_count": entry.referral_count if entry else 0,
                        "referral_code": entry.referral_code if entry else "",
                        "message_sent_at": msg_time,
                    },
                ):
                    if isinstance(event, RunContentEvent) and event.content:
                        accumulated_text += event.content
                        current_time = _time.time()
                        if current_time - last_update_time >= config.MESSAGE_UPDATE_INTERVAL:
                            await safe_edit_message(bot_message, accumulated_text + " ...")
                            last_update_time = current_time
                    elif isinstance(event, RunCompletedEvent):
                        break

                # Extract bouncer remarks
                import re as _re
                remarks_match = _re.search(r'\[BOUNCER_REMARKS\](.*?)\[/BOUNCER_REMARKS\]', accumulated_text, _re.DOTALL)
                if remarks_match:
                    accumulated_text = _re.sub(r'\[BOUNCER_REMARKS\].*?\[/BOUNCER_REMARKS\]', '', accumulated_text, flags=_re.DOTALL).strip()
                    try:
                        import json
                        remarks_data = json.loads(remarks_match.group(1).strip())
                        score = remarks_data.get("score", 0)
                        set_bouncer_remarks(user_id, json.dumps(remarks_data), score)
                        logger.info(f"Bouncer scored user {user_id}: {score}/10")

                        if score >= 7 and entry and entry.status == "waiting":
                            from .waitlist import approve_user
                            approve_user(user_id)
                            logger.info(f"Bouncer auto-approved user {user_id} with score {score}")
                    except (json.JSONDecodeError, Exception) as e:
                        logger.warning(f"Failed to parse bouncer remarks: {e}")

                if accumulated_text:
                    await safe_edit_message(bot_message, accumulated_text)
                else:
                    await bot_message.edit_text("hmm. try again.")

            except Exception as e:
                logger.exception(f"Bouncer agent error: {e}")
                await bot_message.edit_text("something went wrong. try again.")
            return

        # access["access"] == "full" — fall through to normal flow

    # ── Email collection ──
    if context.user_data.get("awaiting_email"):
        context.user_data["awaiting_email"] = False
        import re
        import asyncio as _aio
        email = message_text.strip()
        if re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            from .waitlist import set_email
            set_email(user_id, email)
            await update.message.reply_text("saved 🫡")

            await _aio.sleep(1)
            await update.message.chat.send_action(ChatAction.TYPING)
            await _aio.sleep(1.5)

            await update.message.reply_text(
                "anyway — drop your solana wallet address. wanna see what you're working with 👀"
            )
        else:
            # Not an email — treat as a regular message, route to bouncer
            # But first, let them know about email
            await update.message.reply_text(
                "that's not an email but whatever. you can set it later with /email"
            )
            await _aio.sleep(1)
            await update.message.chat.send_action(ChatAction.TYPING)
            await _aio.sleep(1.5)
            await update.message.reply_text(
                "drop your solana wallet address tho. wanna see what you're working with 👀"
            )
        return

    # Check if user is connecting an external wallet
    if context.user_data.get("awaiting_external_wallet"):
        context.user_data["awaiting_external_wallet"] = False
        address = message_text.strip()

        if not _validate_solana_address(address):
            await update.message.reply_text(
                "that doesn't look like a valid solana address. "
                "should be 32-44 base58 characters. try again via /wallet."
            )
            return

        if update_external_wallet(user_id, address):
            # Auto-switch to external mode
            update_signing_mode(user_id, "external")
            logger.info(f"User {user_id} connected external wallet: {address}")

            # Route through agent for the portfolio wow moment
            await update.message.chat.send_action(ChatAction.TYPING)
            bot_message = await update.message.reply_text("pulling your portfolio...")

            user_profile = get_user_profile(user_id)
            session_state = {
                "wallet_address": user_profile.wallet_address,
                "wallet_id": user_profile.wallet_id,
                "telegram_username": user_profile.telegram_username,
                "telegram_user_id": user_id,
                "solana_network": user_profile.solana_network or "mainnet",
                "signing_mode": "external",
                "external_wallet_address": address,
                "preferred_wallet_app": user_profile.preferred_wallet_app or "phantom",
            }

            try:
                client, agent_id = await get_client_and_agent()
                await stream_response(
                    update=update,
                    bot_message=bot_message,
                    client=client,
                    agent_id=agent_id,
                    message=f"[EXTERNAL_WALLET_CONNECTED] address: {address}",
                    user_id=str(user_id),
                    session_id=session_id,
                    session_state=session_state,
                )
            except Exception as e:
                logger.exception(f"Agent error on external wallet connect: {e}")
                await bot_message.edit_text(
                    f"external wallet connected: `{address}`\n\n"
                    "switched to external signing mode. use /wallet to change settings."
                )
        else:
            await update.message.reply_text("failed to save wallet. try /wallet again.")
        return

    logger.info(f"Message from user {user_id}: {message_text[:50]}...")

    await update.message.chat.send_action(ChatAction.TYPING)
    bot_message = await update.message.reply_text("Thinking...")

    # Get user profile from database for session state
    user_profile = get_user_profile(user_id)

    if not user_profile or not user_profile.wallet_address:
        try:
            privy = PrivyClient()
            wallet = await privy.create_solana_wallet(idempotency_key=f"tg_{user_id}")

            if user_profile:
                update_user_wallet(user_id, wallet["address"], wallet["id"])
            else:
                user = update.effective_user
                create_user_profile(
                    telegram_user_id=user_id,
                    telegram_username=user.username or user.first_name,
                    wallet_address=wallet["address"],
                    wallet_id=wallet["id"],
                )

            logger.info(f"Auto-onboarded user {user_id}: {wallet['address']}")

            # Send first-time message with their original query appended
            user = update.effective_user

            # Inject bouncer remarks if available (context from waitlist evaluation)
            bouncer_context = ""
            if waitlist_enabled:
                from .waitlist import get_waitlist_entry
                wl_entry = get_waitlist_entry(user_id)
                if wl_entry and wl_entry.remarks:
                    bouncer_context = f"\n\n[BOUNCER_CONTEXT] The bouncer already learned about this user: {wl_entry.remarks}. Use this to personalize the onboarding — reference things you already know about them naturally, as if you remember. Do NOT mention the bouncer or evaluation."

            onboard_message = (
                f"[FIRST_TIME_USER] {user.username or user.first_name} just joined! "
                f"Wallet: {wallet['address']}\n\n"
                f"Their first message: {message_text}"
                f"{bouncer_context}"
            )

            session_state = {
                "wallet_address": wallet["address"],
                "wallet_id": wallet["id"],
                "telegram_username": user.username or user.first_name,
                "telegram_user_id": user_id,
                "solana_network": "mainnet",
                "signing_mode": "internal",
                "external_wallet_address": None,
                "preferred_wallet_app": "phantom",
            }

            try:
                client, agent_id = await get_client_and_agent()
                await stream_response(
                    update=update,
                    bot_message=bot_message,
                    client=client,
                    agent_id=agent_id,
                    message=onboard_message,
                    user_id=str(user_id),
                    session_id=session_id,
                    session_state=session_state,
                )
            except Exception as e:
                logger.exception(f"Agent error during auto-onboard: {e}")
                await bot_message.edit_text(
                    f"yo. made you a wallet: `{wallet['address']}`\n\n"
                    "something went wrong talking to the agent tho. try again?"
                )
            return
        except Exception as e:
            logger.exception(f"Auto-onboard failed for {user_id}: {e}")
            await bot_message.edit_text(
                "couldn't set you up automatically. tap /start to get going."
            )
            return

    # Get message timestamp from Telegram (UTC)
    msg_time = update.message.date.strftime("%Y-%m-%d %H:%M:%S UTC") if update.message.date else None

    session_state = {
        "wallet_address": user_profile.wallet_address,
        "wallet_id": user_profile.wallet_id,
        "telegram_username": user_profile.telegram_username,
        "telegram_user_id": user_id,
        "solana_network": user_profile.solana_network or "mainnet",
        "signing_mode": user_profile.signing_mode or "internal",
        "external_wallet_address": user_profile.external_wallet_address,
        "preferred_wallet_app": user_profile.preferred_wallet_app or "phantom",
        "message_sent_at": msg_time,
    }

    try:
        client, agent_id = await get_client_and_agent()
        await stream_response(
            update=update,
            bot_message=bot_message,
            client=client,
            agent_id=agent_id,
            message=message_text,
            user_id=str(user_id),
            session_id=session_id,
            session_state=session_state,
        )
    except RemoteServerUnavailableError:
        logger.error("AgentOS unavailable")
        await bot_message.edit_text(
            "I'm having trouble connecting to the agent service. "
            "Please try again later."
        )
    except Exception as e:
        logger.exception(f"Unexpected error: {e}")
        await bot_message.edit_text("Something went wrong. Please try again.")


async def stream_response(
    update: Update,
    bot_message,
    client: AgentOSClient,
    agent_id: str,
    message: str,
    user_id: str,
    session_id: str,
    session_state: dict | None = None,
) -> None:
    """Stream agent response with periodic message updates."""
    accumulated_text = ""
    pending_swap_data = None  # Captured from ToolCallCompletedEvent
    last_update_time = time.time()
    update_interval = config.MESSAGE_UPDATE_INTERVAL

    # Track the API call
    tracker = APICallTracker("run_agent_stream", user_id)
    tracker.start_time = time.time()
    tracker.set_request(
        agent_id=agent_id,
        message=message[:100] if message else None,  # Truncate long messages
        session_id=session_id,
        has_session_state=session_state is not None
    )

    chunk_count = 0
    first_chunk_time = None
    error_occurred = False

    try:
        async for event in client.run_agent_stream(
            agent_id=agent_id,
            message=message,
            user_id=user_id,
            session_id=session_id,
            session_state=session_state,
        ):
            chunk_count += 1

            # Track time to first chunk
            if first_chunk_time is None:
                first_chunk_time = time.time()
                time_to_first = first_chunk_time - tracker.start_time
                logger.debug(f"First chunk for user {user_id} after {time_to_first:.2f}s")

            if isinstance(event, RunContentEvent) and event.content:
                accumulated_text += event.content

                current_time = time.time()
                if current_time - last_update_time >= update_interval:
                    await safe_edit_message(bot_message, accumulated_text + " ...")
                    last_update_time = current_time
                    await update.message.chat.send_action(ChatAction.TYPING)

            elif isinstance(event, ToolCallCompletedEvent) and event.tool:
                # Intercept tool results to detect pending_signature for TMA signing
                tool_result = event.tool.result or ""
                tool_name = event.tool.tool_name or ""
                if "pending_signature" in tool_result and tool_name in ("swap_tokens", "send_sol", "send_token"):
                    try:
                        import json
                        result_data = json.loads(tool_result)
                        if result_data.get("status") == "pending_signature":
                            pending_swap_data = result_data
                            logger.info(f"Captured pending_signature from {tool_name}")
                    except (json.JSONDecodeError, Exception) as e:
                        logger.warning(f"Failed to parse tool result: {e}")

            elif isinstance(event, RunCompletedEvent):
                break

        # Log successful completion
        duration = time.time() - tracker.start_time
        tracker.set_response({
            "success": True,
            "chunk_count": chunk_count,
            "response_length": len(accumulated_text),
            "time_to_first_chunk": first_chunk_time - tracker.start_time if first_chunk_time else None,
            "total_duration": duration
        })

        # Log the completed API call
        from .api_logger import api_logger
        log_data = {
            "api_data": {
                "operation": "run_agent_stream",
                "user_id": user_id,
                "duration_seconds": round(duration, 3),
                "success": True,
                "request": tracker.request_data,
                "response": tracker.response_data,
            }
        }

        if duration > 10:
            api_logger.warning(
                f"Slow streaming response for user {user_id}: {duration:.2f}s",
                extra=log_data
            )
        else:
            api_logger.info(
                f"Streaming completed for user {user_id}: {duration:.2f}s, {chunk_count} chunks",
                extra=log_data
            )

    except Exception as e:
        error_occurred = True
        duration = time.time() - tracker.start_time

        # Log the error
        from .api_logger import api_logger
        log_data = {
            "api_data": {
                "operation": "run_agent_stream",
                "user_id": user_id,
                "duration_seconds": round(duration, 3),
                "success": False,
                "request": tracker.request_data,
                "error": {
                    "type": type(e).__name__,
                    "message": str(e),
                    "chunks_before_error": chunk_count
                }
            }
        }
        api_logger.error(
            f"Streaming failed for user {user_id} after {chunk_count} chunks",
            extra=log_data
        )
        raise

    finally:
        if accumulated_text:
            # Check for embedded chart image
            clean_text, chart_base64 = extract_chart_image(accumulated_text)

            if chart_base64:
                # Send chart as photo
                try:
                    import base64
                    image_bytes = base64.b64decode(chart_base64)
                    await update.message.chat.send_photo(
                        photo=image_bytes,
                        caption=clean_text[:1024] if clean_text else None  # Caption limit is 1024
                    )
                    # Delete the "Thinking..." message
                    await bot_message.delete()
                except Exception as e:
                    logger.warning(f"Failed to send chart image: {e}")
                    # Fallback to text
                    await safe_edit_message(bot_message, clean_text or "couldn't load chart")
            else:
                # Check for pending swap from tool results (TMA signing flow)
                clean_text = strip_sign_tx_tags(accumulated_text)
                clean_text, _ = extract_pending_swap(clean_text)  # Strip any PENDING_SWAP tags too
                tma_url = await create_tma_signing_session(pending_swap_data, session_state) if pending_swap_data else None

                if tma_url:
                    keyboard = [[InlineKeyboardButton(
                        "\U0001f510 Sign Transaction",
                        url=tma_url,
                    )]]
                    reply_markup = InlineKeyboardMarkup(keyboard)
                    try:
                        parsed = parse_markdown_to_entities(truncate_message(clean_text))
                        if parsed.entities:
                            await bot_message.edit_text(parsed.text, entities=parsed.entities, reply_markup=reply_markup)
                        else:
                            await bot_message.edit_text(parsed.text, reply_markup=reply_markup)
                    except BadRequest as e:
                        logger.warning(f"TMA button formatting failed: {e}")
                        await bot_message.edit_text(truncate_message(clean_text), reply_markup=reply_markup)
                else:
                    await safe_edit_message(bot_message, clean_text)
        elif not error_occurred:
            await bot_message.edit_text("I couldn't generate a response. Please try again.")


async def safe_edit_message(bot_message, text: str) -> None:
    """Safely edit message with proper formatting using entities."""
    text = truncate_message(text)

    try:
        # Parse markdown to plain text + entities (no escaping needed)
        parsed = parse_markdown_to_entities(text)
        if parsed.entities:
            await bot_message.edit_text(parsed.text, entities=parsed.entities)
        else:
            await bot_message.edit_text(parsed.text)
        return
    except BadRequest as e:
        logger.warning(f"Entity formatting failed: {e}, trying plain text")

    try:
        plain_text = format_simple(text)
        await bot_message.edit_text(plain_text)
    except BadRequest:
        await bot_message.edit_text(text[:4000])


async def error_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle errors in the bot."""
    logger.error(f"Update {update} caused error: {context.error}")
    if update and update.effective_message:
        await update.effective_message.reply_text(
            "An error occurred while processing your request. Please try again."
        )


async def waitlist_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /waitlist - show position and referral link."""
    from .waitlist import get_waitlist_entry, get_waitlist_count, get_approved_count
    user_id = update.effective_user.id
    entry = get_waitlist_entry(user_id)

    if not entry:
        await update.message.reply_text("you're not on the waitlist. send any message to join.")
        return

    if entry.status in ("approved", "active"):
        await update.message.reply_text("you're already in. stop flexing 💀")
        return

    total = get_waitlist_count()
    approved = get_approved_count()
    refs_left = max(0, 5 - entry.referral_count)

    await update.message.reply_text(
        f"📊 your waitlist stats:\n\n"
        f"position: #{entry.position} of {total}\n"
        f"referrals: {entry.referral_count}\n"
        f"status: {entry.status}\n\n"
        f"share your link to move up:\n"
        f"raze.fun/ref/{entry.referral_code}\n\n"
        f"{'instant access in ' + str(refs_left) + ' more referral(s)' if refs_left > 0 else 'you qualify for instant access!'}"
    )


async def refer_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /refer - show referral link and stats."""
    from .waitlist import get_waitlist_entry
    entry = get_waitlist_entry(update.effective_user.id)
    if not entry:
        await update.message.reply_text("join the waitlist first — send any message.")
        return

    await update.message.reply_text(
        f"your referral link:\n\n"
        f"raze.fun/ref/{entry.referral_code}\n\n"
        f"referrals so far: {entry.referral_count}\n"
        f"every referral = +50 spots. 5 = instant access.\n\n"
        f"share it everywhere 🚀"
    )


async def email_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /email - set or update email."""
    context.user_data["awaiting_email"] = True
    await update.message.reply_text("drop your email 👇")


async def card_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle /card - generate and send waitlist card image."""
    from .waitlist import get_waitlist_entry, get_waitlist_count
    from .waitlist_card import generate_waitlist_card
    import io

    user_id = update.effective_user.id
    entry = get_waitlist_entry(user_id)

    if not entry:
        await update.message.reply_text("join the waitlist first — send any message.")
        return

    if entry.status in ("approved", "active"):
        await update.message.reply_text("you're already in. no waitlist card needed 💀")
        return

    await update.message.chat.send_action(ChatAction.TYPING)

    total = get_waitlist_count()
    png_bytes = generate_waitlist_card(
        username=entry.telegram_username or update.effective_user.first_name or "anon",
        position=entry.position,
        referral_count=entry.referral_count,
        total_waitlist=total,
        referral_code=entry.referral_code,
    )

    await update.message.reply_photo(
        photo=io.BytesIO(png_bytes),
        caption=f"share this to flex your spot 🫡\n\nraze.fun/ref/{entry.referral_code}",
    )


def create_application() -> Application:
    """Create and configure the Telegram bot application."""
    app = Application.builder().token(config.TELEGRAM_BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("wallet", wallet_command))
    app.add_handler(CommandHandler("waitlist", waitlist_command))
    app.add_handler(CommandHandler("refer", refer_command))
    app.add_handler(CommandHandler("email", email_command))
    app.add_handler(CommandHandler("card", card_command))
    app.add_handler(CommandHandler("alerts", alerts_command))
    app.add_handler(CommandHandler("clear", clear_command))
    app.add_handler(CommandHandler("apistats", apistats_command))
    app.add_handler(CommandHandler("network", network_command))
    # MCP server commands
    app.add_handler(CommandHandler("addmcp", addmcp_command))
    app.add_handler(CommandHandler("listmcp", listmcp_command))
    app.add_handler(CommandHandler("removemcp", removemcp_command))
    app.add_handler(CommandHandler("togglemcp", togglemcp_command))
    # Callback handlers
    app.add_handler(CallbackQueryHandler(network_callback, pattern="^network_"))
    app.add_handler(CallbackQueryHandler(wallet_mode_callback, pattern="^wallet_mode_"))
    app.add_handler(CallbackQueryHandler(wallet_connect_callback, pattern="^wallet_connect$"))
    app.add_handler(CallbackQueryHandler(wallet_app_callback, pattern="^wallet_app_"))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    app.add_error_handler(error_handler)

    return app
