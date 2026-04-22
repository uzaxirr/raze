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


# In-memory cache for identity labels (exchange addresses don't change)
_identity_cache: dict[str, str | None] = {}
_sns_cache: dict[str, str | None] = {}


async def _resolve_identities(addresses: list[str], helius_key: str) -> dict[str, str]:
    """Batch-resolve addresses to identity labels via Helius Identity API.
    Returns {address: "Binance Hot Wallet 1 (exchange)"} for known entities.
    Uses in-memory cache. Batch endpoint handles up to 100 addresses in one call (100 credits)."""
    import httpx

    result = {}
    uncached = []
    for addr in addresses[:100]:
        if addr in _identity_cache:
            if _identity_cache[addr]:
                result[addr] = _identity_cache[addr]
        else:
            uncached.append(addr)

    if not uncached:
        return result

    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.post(
                f"https://api.helius.xyz/v1/wallet/batch-identity",
                params={"api-key": helius_key},
                json={"addresses": uncached},
            )
            if resp.status_code == 200:
                for item in resp.json():
                    addr = item.get("address", "")
                    ident_type = item.get("type", "unknown")
                    if ident_type != "unknown" and item.get("name"):
                        label = f"{item['name']} ({item.get('category', ident_type)})"
                        _identity_cache[addr] = label
                        result[addr] = label
                        # Also capture .sol domains from identity response
                        domains = item.get("domainNames", [])
                        if domains:
                            _sns_cache[addr] = domains[0] if domains[0].endswith(".sol") else f"{domains[0]}.sol"
                    else:
                        _identity_cache[addr] = None
    except Exception:
        pass  # Silent fallback — identity is enrichment, not critical

    return result


async def _resolve_sns_domain(address: str) -> str | None:
    """Resolve address to .sol domain via Helius Identity API domainNames field.
    Falls back to Bonfida proxy (1s timeout). Returns 'alice.sol' or None. Cached.
    Note: The agent also has get_domains tool for on-demand reverse lookup."""
    if address in _sns_cache:
        return _sns_cache[address]
    # SNS resolution happens opportunistically via Helius Identity (domainNames field).
    # We don't make a separate call here — the identity batch already captures it.
    _sns_cache[address] = None
    return None


# In-memory cache for mint → symbol resolution (survives within container lifetime)
_mint_symbol_cache: dict[str, str | None] = {}


async def _resolve_mint_symbol(mint: str, helius_key: str) -> str | None:
    """Resolve a mint address to its token symbol via Helius DAS getAsset.
    Cached in-memory. Returns symbol or None."""
    import httpx

    if mint in _mint_symbol_cache:
        return _mint_symbol_cache[mint]

    try:
        rpc_url = f"https://mainnet.helius-rpc.com/?api-key={helius_key}"
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.post(rpc_url, json={
                "jsonrpc": "2.0", "id": 1,
                "method": "getAsset",
                "params": {"id": mint},
            })
            if resp.status_code == 200:
                data = resp.json().get("result", {})
                symbol = data.get("content", {}).get("metadata", {}).get("symbol", "")
                if symbol:
                    _mint_symbol_cache[mint] = symbol
                    return symbol
    except Exception:
        pass

    _mint_symbol_cache[mint] = None
    return None


def _replace_mints_with_symbols(text: str, mint_map: dict[str, str]) -> str:
    """Replace raw mint addresses in text with their symbols using a provided mapping."""
    for mint, symbol in mint_map.items():
        if mint in text:
            text = text.replace(mint, symbol)
    return text


async def _fetch_wallet_context(wallet_address: str) -> str:
    """Fetch wallet balances + recent txs from Helius, enriched with identity labels.

    Fires DAS, transactions, and identity resolution in parallel.
    Identity labels turn raw addresses into stories (e.g., "sent 5 SOL to Binance Hot Wallet").
    """
    import httpx
    import asyncio
    import time as _time

    helius_key = os.getenv("HELIUS_API_KEY", "")
    if not helius_key:
        return ""

    rpc_url = f"https://mainnet.helius-rpc.com/?api-key={helius_key}"
    helius_api = f"https://api.helius.xyz/v0"

    # Known Liquid Staking Token mints → underlying asset
    LST_MINTS = {
        "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So": ("mSOL", "Marinade"),
        "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn": ("jitoSOL", "Jito"),
        "bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1": ("bSOL", "Blaze"),
        "he1iusmfkpAdwvxLNGV8Y1iSbj4rUy6yMhEA3fotn9A": ("hSOL", "Helius"),
        "5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm": ("scnSOL", "Socean"),
        "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj": ("stSOL", "Lido"),
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            # Phase 1: DAS assets + parsed transactions (parallel)
            assets_task = client.post(rpc_url, json={
                "jsonrpc": "2.0", "id": 1,
                "method": "getAssetsByOwner",
                "params": {
                    "ownerAddress": wallet_address,
                    "displayOptions": {"showFungible": True, "showNativeBalance": True},
                }
            })
            txs_task = client.get(
                f"{helius_api}/addresses/{wallet_address}/transactions",
                params={"api-key": helius_key, "limit": 5}
            )

            assets_resp, txs_resp = await asyncio.gather(
                assets_task, txs_task,
                return_exceptions=True
            )

        # ── Parse tokens + SOL from DAS ──
        sol_balance = 0.0
        sol_usd = 0.0
        total_usd = 0.0
        token_entries = []  # (symbol, human_balance, usd, flags_str)
        staking_parts = []  # [6] Staking positions

        if not isinstance(assets_resp, Exception):
            assets_data = assets_resp.json()
            native_bal = assets_data.get("result", {}).get("nativeBalance", {})
            if native_bal:
                sol_balance = native_bal.get("lamports", 0) / 1e9
                sol_usd = native_bal.get("price_per_sol", 0) * sol_balance
                total_usd += sol_usd

            items = assets_data.get("result", {}).get("items", [])
            for item in items[:20]:
                content = item.get("content", {})
                metadata = content.get("metadata", {})
                symbol = metadata.get("symbol", "")
                if not symbol or symbol == "SOL":
                    continue
                token_info = item.get("token_info", {})
                balance = token_info.get("balance", 0)
                decimals = token_info.get("decimals", 0)
                if not (balance and decimals):
                    continue
                human_balance = balance / (10 ** decimals)
                if human_balance <= 0:
                    continue

                price = token_info.get("price_info", {}).get("price_per_token", 0)
                usd = human_balance * price if price else 0
                total_usd += usd

                mint = item.get("id", "")

                # [6] Detect staking positions (LSTs)
                if mint in LST_MINTS:
                    lst_name, protocol = LST_MINTS[mint]
                    staking_parts.append(f"{human_balance:.4g} {lst_name} via {protocol} (${usd:.2f})")
                    continue  # Don't add to regular token list

                if usd < 0.01:
                    continue

                # [1] Token flags: mint authority + freeze authority
                flags = []
                if token_info.get("mint_authority"):
                    flags.append("mint:active")
                if token_info.get("freeze_authority"):
                    flags.append("freeze:active")

                # [3] Supply + holder concentration
                supply = token_info.get("supply")
                pct_str = ""
                if supply and supply > 0 and decimals:
                    pct = (balance / supply) * 100
                    if pct >= 0.001:
                        pct_str = f", holds {pct:.4g}% supply"

                flags_str = ""
                if flags or pct_str:
                    parts = []
                    if flags:
                        parts.append(" ".join(flags))
                    if pct_str:
                        parts.append(pct_str.lstrip(", "))
                    flags_str = " [" + ", ".join(parts) + "]"

                token_entries.append((symbol, human_balance, usd, flags_str))

                # Build mint → symbol map from portfolio (free, no extra API calls)
                if mint and symbol:
                    _mint_symbol_cache[mint] = symbol

        # Sort by USD value descending, take top 5
        token_entries.sort(key=lambda x: x[2], reverse=True)
        token_parts = [f"{sym}: {bal:.4g} (${usd:.2f}){flags}" for sym, bal, usd, flags in token_entries[:5]]

        # ── Parse transactions ──
        tx_entries = []  # (time_str, description, counterparty_addresses)
        counterparty_set = set()
        total_fees_lamports = 0
        failed_tx_count = 0
        oldest_tx_ts = None

        if not isinstance(txs_resp, Exception) and txs_resp.status_code == 200:
            txs_data = txs_resp.json()
            now = int(_time.time())
            for tx in txs_data[:5]:
                block_time = tx.get("timestamp", 0)
                ago = now - block_time if block_time else 0
                if ago < 60:
                    time_str = f"{ago}s ago"
                elif ago < 3600:
                    time_str = f"{ago // 60}min ago"
                elif ago < 86400:
                    time_str = f"{ago // 3600}hr ago"
                else:
                    time_str = f"{ago // 86400}d ago"

                # [7] Track failed transactions
                tx_error = tx.get("transactionError")
                failed_tag = ""
                if tx_error:
                    failed_tx_count += 1
                    failed_tag = " ❌FAILED"

                # [8] Accumulate fees
                fee = tx.get("fee", 0)
                total_fees_lamports += fee

                # [9] Track oldest tx for wallet age estimation
                if block_time and (oldest_tx_ts is None or block_time < oldest_tx_ts):
                    oldest_tx_ts = block_time

                # Description + source
                desc = tx.get("description", "")
                if desc:
                    desc = desc[:120]
                else:
                    desc = tx.get("type", "unknown").lower().replace("_", " ")
                source = tx.get("source", "")
                if source and source not in ("SYSTEM_PROGRAM", "SOLANA_PROGRAM_LIBRARY", "UNKNOWN"):
                    source_name = source.replace("_", " ").title()
                    if source_name.lower() not in desc.lower():
                        desc += f" [via {source_name}]"

                # [2] Enrich swap events with structured data
                events = tx.get("events", {})
                if isinstance(events, dict) and "swap" in events:
                    swap_evt = events["swap"]
                    if isinstance(swap_evt, dict):
                        native_in = swap_evt.get("nativeInput", {})
                        native_out = swap_evt.get("nativeOutput", {})
                        token_ins = swap_evt.get("tokenInputs", [])
                        token_outs = swap_evt.get("tokenOutputs", [])
                        inner_swaps = swap_evt.get("innerSwaps", [])
                        if inner_swaps:
                            route_protos = set()
                            for s in inner_swaps:
                                prog = s.get("programInfo", {}).get("source", "")
                                if prog:
                                    route_protos.add(prog.replace("_", " ").title())
                            if route_protos:
                                desc += f" (route: {' → '.join(list(route_protos)[:3])})"

                desc += failed_tag

                # Collect counterparty addresses from transfers
                addrs_in_tx = set()
                for tt in tx.get("tokenTransfers", []):
                    for key in ("fromUserAccount", "toUserAccount"):
                        addr = tt.get(key)
                        if addr and addr != wallet_address:
                            addrs_in_tx.add(addr)
                for nt in tx.get("nativeTransfers", []):
                    for key in ("fromUserAccount", "toUserAccount"):
                        addr = nt.get(key)
                        if addr and addr != wallet_address:
                            addrs_in_tx.add(addr)

                counterparty_set.update(addrs_in_tx)
                tx_entries.append((time_str, desc, addrs_in_tx))

        # ── Phase 2: Identity enrichment ──
        counterparties = list(counterparty_set)
        identity_labels = {}
        user_domain = None

        if counterparties:
            identity_labels = await _resolve_identities(counterparties, helius_key)
        user_domain = _sns_cache.get(wallet_address)

        # Collect unknown mints from tx descriptions and resolve via DAS getAsset
        import re as _re_mod
        _mint_pattern = _re_mod.compile(r'[1-9A-HJ-NP-Za-km-z]{32,44}')
        unknown_mints = set()
        for _, desc, _ in tx_entries:
            for match in _mint_pattern.findall(desc):
                if match not in _mint_symbol_cache and match != wallet_address:
                    unknown_mints.add(match)

        # Resolve unknown mints in parallel (max 5 to bound latency)
        if unknown_mints:
            import asyncio as _aio
            resolve_tasks = [_resolve_mint_symbol(m, helius_key) for m in list(unknown_mints)[:5]]
            await _aio.gather(*resolve_tasks, return_exceptions=True)

        # Build enriched transaction descriptions — replace addresses + mints with labels
        tx_parts = []
        for time_str, desc, addrs in tx_entries:
            enriched = desc
            # Replace counterparty addresses with identity labels
            for addr in addrs:
                label = identity_labels.get(addr)
                if label:
                    enriched = enriched.replace(addr, label)
            # Replace raw mint addresses with token symbols
            enriched = _replace_mints_with_symbols(enriched, _mint_symbol_cache)
            tx_parts.append(f"{time_str}: {enriched}")

        # ── Format compact context ──
        header = f"[WALLET {wallet_address[:8]}...{wallet_address[-4:]}]"
        if user_domain:
            header += f" ({user_domain})"
        context = header + "\n"
        context += f"Portfolio: ${total_usd:.2f}\n"
        context += f"SOL: {sol_balance:.4f} (${sol_usd:.2f})"
        if token_parts:
            context += " | " + " | ".join(token_parts)

        # [6] Staking positions
        if staking_parts:
            context += "\nStaking: " + " | ".join(staking_parts)

        # Recent activity
        if tx_parts:
            context += "\nRecent activity:\n" + "\n".join(f"  • {t}" for t in tx_parts[:4])

        # [8] Fee summary + [7] failed tx count
        stats = []
        if total_fees_lamports > 0:
            total_fees_sol = total_fees_lamports / 1e9
            stats.append(f"fees: {total_fees_sol:.6f} SOL (last 5 txs)")
        if failed_tx_count > 0:
            stats.append(f"{failed_tx_count} failed tx")
        # [9] Wallet age from oldest tx in the batch
        if oldest_tx_ts:
            now = int(_time.time())
            age_days = (now - oldest_tx_ts) // 86400
            if age_days > 0:
                stats.append(f"active ≥{age_days}d")
        if stats:
            context += "\nStats: " + " | ".join(stats)

        # Known counterparty identities
        if identity_labels:
            context += "\nKnown addresses in recent txs:"
            for addr, label in identity_labels.items():
                context += f"\n  {addr[:8]}...{addr[-4:]} = {label}"

        return context

    except Exception as e:
        logger.warning(f"Wallet context fetch failed: {e}")
        return ""


async def create_signing_session(
    swap_params: dict,
    session_state: dict | None,
    telegram_chat_id: int | str | None = None,
) -> str | None:
    """
    Create an intent-based signing session via the backend API.
    Returns a raze.fun/sign URL with viewer token.
    """
    if not session_state or not swap_params:
        return None

    frontend_url = os.getenv("RAZE_FRONTEND_URL", "https://raze.fun")
    backend_url = os.getenv("AGENTOS_BASE_URL", "http://localhost:7777")
    sign_secret = os.getenv("RAZE_SIGN_SECRET")
    if not sign_secret:
        logger.error("RAZE_SIGN_SECRET not set — cannot create signing session")
        return None

    try:
        import httpx
        # Intent-only payload — NO pre-built transaction
        payload: dict = {
            "type": swap_params.get("type", "swap"),
            "walletAddress": session_state.get("external_wallet_address") or session_state.get("wallet_address"),
            "fromToken": swap_params.get("from_token", swap_params.get("fromSymbol", "")),
            "toToken": swap_params.get("to_token", swap_params.get("toSymbol", "")),
            "amount": swap_params.get("input_amount", swap_params.get("amount", 0)),
            "toAddress": swap_params.get("to", swap_params.get("toAddress", "")),
            "slippageBps": 50,
            "network": session_state.get("solana_network", "mainnet"),
        }
        if telegram_chat_id is not None:
            payload["telegramChatId"] = int(telegram_chat_id)

        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{backend_url}/api/sign/sessions",
                json=payload,
                headers={"x-sign-secret": sign_secret},
            )
            if resp.status_code == 200:
                data = resp.json()
                session_id = data.get("sessionId")
                viewer_token = data.get("viewerToken")
                return f"{frontend_url}/sign/{session_id}?t={viewer_token}"
            else:
                logger.error(f"Session creation failed: {resp.status_code} {resp.text}")
    except Exception as e:
        logger.error(f"Failed to create signing session: {e}")

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

            await _aio.sleep(1.5)
            await update.message.chat.send_action(ChatAction.TYPING)
            await _aio.sleep(1.5)

            await update.message.reply_text(
                "also drop your wallet address and watch the magic. or don't. your call 👀"
            )
            context.user_data["awaiting_email_or_wallet"] = True
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
                import re as _re
                client, _ = await get_client_and_agent()
                bouncer_session_id = f"bouncer_{user_id}"
                msg_time = update.message.date.strftime("%Y-%m-%d %H:%M:%S UTC") if update.message.date else None

                accumulated_text = ""
                import time as _time
                last_update_time = _time.time()

                # Track bouncer conversation step
                bouncer_step = context.user_data.get("bouncer_step", 0)
                has_wallet = context.user_data.get("bouncer_has_wallet", False)

                # Detect if user just shared a wallet address (32-44 base58 chars)
                if _re.match(r'^[1-9A-HJ-NP-Za-km-z]{32,44}$', message_text.strip()) and not has_wallet:
                    context.user_data["bouncer_has_wallet"] = True
                    context.user_data["bouncer_wallet_address"] = message_text.strip()
                    context.user_data["bouncer_step"] = 1  # wallet just shared, start sequence
                    bouncer_step = 1
                elif has_wallet and bouncer_step > 0:
                    bouncer_step = context.user_data.get("bouncer_step", 1)

                pending_swap_data = None
                # Fetch wallet context for bouncer if wallet shared
                bouncer_wallet_ctx = ""
                bouncer_wallet_addr = context.user_data.get("bouncer_wallet_address")
                if bouncer_wallet_addr:
                    try:
                        bouncer_wallet_ctx = await _fetch_wallet_context(bouncer_wallet_addr)
                    except Exception:
                        pass

                # Resolve step instruction text for this bouncer step
                from bouncer_prompt import get_step_instruction
                step_instruction_text = get_step_instruction(bouncer_step)

                bouncer_session_state = {
                    "telegram_username": update.effective_user.username or update.effective_user.first_name,
                    "telegram_user_id": user_id,
                    "bouncer_step": bouncer_step,
                    "step_instruction": step_instruction_text,
                    "position": entry.position if entry else 0,
                    "referral_count": entry.referral_count if entry else 0,
                    "referral_code": entry.referral_code if entry else "",
                    "message_sent_at": msg_time,
                    "signing_mode": "external",
                    "external_wallet_address": bouncer_wallet_addr,
                    "wallet_context": bouncer_wallet_ctx,
                }

                async for event in client.run_agent_stream(
                    agent_id="bouncer",
                    message=message_text,
                    user_id=str(user_id),
                    session_id=bouncer_session_id,
                    session_state=bouncer_session_state,
                ):
                    if isinstance(event, RunContentEvent) and event.content:
                        accumulated_text += event.content
                        current_time = _time.time()
                        if current_time - last_update_time >= config.MESSAGE_UPDATE_INTERVAL:
                            # Strip [THINK] blocks during streaming so user never sees them
                            display_text = _re.sub(r'\[THINK\].*?\[/THINK\]', '', accumulated_text, flags=_re.DOTALL).strip()
                            display_text = _re.sub(r'\[THINK\].*$', '', display_text, flags=_re.DOTALL).strip()
                            if display_text:
                                await safe_edit_message(bot_message, display_text + " ...")
                            last_update_time = current_time
                    elif isinstance(event, ToolCallCompletedEvent) and event.tool:
                        tool_result = event.tool.result or ""
                        tool_name = event.tool.tool_name or ""
                        if "pending_signature" in tool_result and tool_name in ("swap_tokens", "send_sol", "send_token"):
                            try:
                                import json as _json
                                result_data = _json.loads(tool_result)
                                if result_data.get("status") == "pending_signature":
                                    pending_swap_data = result_data
                                    logger.info(f"Bouncer: captured pending_signature from {tool_name}")
                            except Exception as e:
                                logger.warning(f"Bouncer: failed to parse tool result: {e}")
                    elif isinstance(event, RunCompletedEvent):
                        break

                # Increment bouncer step after each exchange
                if context.user_data.get("bouncer_has_wallet") and bouncer_step > 0:
                    context.user_data["bouncer_step"] = bouncer_step + 1

                # Strip hidden thought blocks
                accumulated_text = _re.sub(r'\[THINK\].*?\[/THINK\]', '', accumulated_text, flags=_re.DOTALL).strip()

                # Extract bouncer remarks
                remarks_match = _re.search(r'\[BOUNCER_REMARKS\](.*?)\[/BOUNCER_REMARKS\]', accumulated_text, _re.DOTALL)
                if remarks_match:
                    accumulated_text = _re.sub(r'\[BOUNCER_REMARKS\].*?\[/BOUNCER_REMARKS\]', '', accumulated_text, flags=_re.DOTALL).strip()
                    try:
                        import json
                        remarks_data = json.loads(remarks_match.group(1).strip())
                        score = remarks_data.get("score", 0)
                        set_bouncer_remarks(user_id, json.dumps(remarks_data), score)
                        logger.info(f"Bouncer scored user {user_id}: {score}/10")

                        # Auto-approve disabled — Uzaxir approves manually via admin bot.
                        # Score is still recorded for manual review.
                        if score >= 7 and entry and entry.status == "waiting":
                            logger.info(f"Bouncer recommends approval for user {user_id} (score {score}) — awaiting manual review")
                    except (json.JSONDecodeError, Exception) as e:
                        logger.warning(f"Failed to parse bouncer remarks: {e}")

                if accumulated_text:
                    # Check for TMA signing flow
                    tma_url = await create_signing_session(pending_swap_data, bouncer_session_state, telegram_chat_id=update.message.chat.id) if pending_swap_data else None
                    if tma_url:
                        keyboard = [[InlineKeyboardButton(
                            "\U0001f510 Sign Transaction",
                            url=tma_url,
                        )]]
                        reply_markup = InlineKeyboardMarkup(keyboard)
                        try:
                            parsed = parse_markdown_to_entities(truncate_message(accumulated_text))
                            if parsed.entities:
                                await bot_message.edit_text(parsed.text, entities=parsed.entities, reply_markup=reply_markup)
                            else:
                                await bot_message.edit_text(parsed.text, reply_markup=reply_markup)
                        except BadRequest:
                            await safe_edit_message(bot_message, accumulated_text)
                    else:
                        await safe_edit_message(bot_message, accumulated_text)
                else:
                    await bot_message.edit_text("hmm. try again.")

            except Exception as e:
                logger.exception(f"Bouncer agent error: {e}")
                await bot_message.edit_text("something went wrong. try again.")
            return

        # access["access"] == "full" — fall through to normal flow

    # ── Email or wallet collection after onboarding bubbles ──
    if context.user_data.get("awaiting_email_or_wallet") or context.user_data.get("awaiting_email"):
        context.user_data["awaiting_email"] = False
        context.user_data["awaiting_email_or_wallet"] = False
        import re
        text = message_text.strip()

        # Check if it's an email
        if re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', text):
            from .waitlist import set_email
            set_email(user_id, text)
            await update.message.reply_text("saved 🫡 now drop your wallet address")
            return

        # Check if it's a wallet address (32-44 base58 chars)
        if re.match(r'^[1-9A-HJ-NP-Za-km-z]{32,44}$', text):
            # It's a wallet — route to bouncer which will analyze it
            pass  # Fall through to bouncer handling below
        else:
            # Neither email nor wallet — route to bouncer
            pass  # Fall through to bouncer handling below

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

    # Fetch wallet context (balances + recent txs) for agent awareness
    wallet_context = ""
    try:
        active_wallet = user_profile.external_wallet_address or user_profile.wallet_address
        if active_wallet:
            wallet_context = await _fetch_wallet_context(active_wallet)
    except Exception as e:
        logger.warning(f"Failed to fetch wallet context: {e}")

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
        "wallet_context": wallet_context,
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
                tma_url = await create_signing_session(pending_swap_data, session_state, telegram_chat_id=update.message.chat.id) if pending_swap_data else None

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
