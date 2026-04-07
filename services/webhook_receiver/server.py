"""
Helius Webhook Receiver
Receives transaction notifications from Helius and notifies users via Telegram.
"""
import os
import sys
import logging
from pathlib import Path
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException, Header
from pydantic import BaseModel
from telegram import Bot
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
from db.models import WalletAlert

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Config
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
HELIUS_WEBHOOK_AUTH = os.getenv("HELIUS_WEBHOOK_AUTH_HEADER", "")
AGENTOS_BASE_URL = os.getenv("AGENTOS_BASE_URL", "http://localhost:7777")
DATABASE_URL = os.getenv("DATABASE_URL", "")

# Log config on import
logger.info(f"DATABASE_URL: {DATABASE_URL[:50]}..." if DATABASE_URL else "DATABASE_URL not set")
logger.info(f"TELEGRAM_BOT_TOKEN set: {bool(TELEGRAM_BOT_TOKEN)}")
logger.info(f"AGENTOS_BASE_URL: {AGENTOS_BASE_URL}")

# Telegram bot instance
bot: Optional[Bot] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize resources on startup."""
    global bot
    if TELEGRAM_BOT_TOKEN:
        bot = Bot(token=TELEGRAM_BOT_TOKEN)
        logger.info("Telegram bot initialized")
    else:
        logger.warning("TELEGRAM_BOT_TOKEN not set - notifications disabled")
    yield
    logger.info("Webhook receiver shutting down")


app = FastAPI(
    title="Helius Webhook Receiver",
    version="1.0.0",
    lifespan=lifespan
)


# Pydantic models for Helius webhook payload
class NativeTransfer(BaseModel):
    fromUserAccount: Optional[str] = None
    toUserAccount: Optional[str] = None
    amount: Optional[int] = None


class TokenTransfer(BaseModel):
    fromUserAccount: Optional[str] = None
    toUserAccount: Optional[str] = None
    mint: Optional[str] = None
    tokenAmount: Optional[float] = None
    tokenStandard: Optional[str] = None


class AccountData(BaseModel):
    account: str
    nativeBalanceChange: Optional[int] = None
    tokenBalanceChanges: Optional[List] = []


class HeliusTransaction(BaseModel):
    signature: str
    type: Optional[str] = "UNKNOWN"
    description: Optional[str] = None
    source: Optional[str] = None
    fee: Optional[int] = None
    feePayer: Optional[str] = None
    slot: Optional[int] = None
    timestamp: Optional[int] = None
    nativeTransfers: Optional[List[NativeTransfer]] = []
    tokenTransfers: Optional[List[TokenTransfer]] = []
    accountData: Optional[List[AccountData]] = []


def extract_accounts(tx: HeliusTransaction) -> List[str]:
    """Extract all account addresses involved in a transaction."""
    accounts = set()

    # Fee payer
    if tx.feePayer:
        accounts.add(tx.feePayer)

    # Native transfers
    for transfer in tx.nativeTransfers or []:
        if transfer.fromUserAccount:
            accounts.add(transfer.fromUserAccount)
        if transfer.toUserAccount:
            accounts.add(transfer.toUserAccount)

    # Token transfers
    for transfer in tx.tokenTransfers or []:
        if transfer.fromUserAccount:
            accounts.add(transfer.fromUserAccount)
        if transfer.toUserAccount:
            accounts.add(transfer.toUserAccount)

    # Account data
    for acc in tx.accountData or []:
        accounts.add(acc.account)

    return list(accounts)


def format_transaction_type(tx_type: str) -> str:
    """Convert Helius transaction type to human-readable format."""
    type_map = {
        "TRANSFER": "transfer",
        "SWAP": "swap",
        "NFT_SALE": "NFT sale",
        "NFT_LISTING": "NFT listing",
        "NFT_BID": "NFT bid",
        "STAKE": "stake",
        "UNSTAKE": "unstake",
        "LOAN": "loan",
        "BURN": "burn",
        "MINT": "mint",
        "COMPRESSED_NFT_MINT": "cNFT mint",
        "TOKEN_MINT": "token mint",
    }
    return type_map.get(tx_type, tx_type.lower().replace("_", " "))


def format_sol_amount(lamports: int) -> str:
    """Format lamports to SOL with appropriate decimals."""
    sol = lamports / 1_000_000_000
    if sol >= 1:
        return f"{sol:.2f} SOL"
    elif sol >= 0.01:
        return f"{sol:.4f} SOL"
    else:
        return f"{sol:.6f} SOL"


def format_address(addr: str) -> str:
    """Shorten address for display."""
    if not addr:
        return "unknown"
    return f"{addr[:4]}...{addr[-4:]}"


def format_timestamp(ts: int) -> str:
    """Format Unix timestamp to readable date."""
    from datetime import datetime
    if not ts:
        return ""
    dt = datetime.utcfromtimestamp(ts)
    return dt.strftime("%Y-%m-%d %H:%M:%S UTC")


async def inject_memory(user_id: int, memory_text: str, topics: List[str] = None):
    """Inject a memory into Agno so agent recalls it in future conversations."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AGENTOS_BASE_URL}/memories",
                json={
                    "user_id": str(user_id),
                    "memory": memory_text,
                    "topics": topics or ["wallet_alerts", "notifications"]
                },
                timeout=10
            )
            if response.status_code in (200, 201):
                logger.info(f"Memory injected for user {user_id}")
            else:
                logger.warning(f"Failed to inject memory: {response.status_code} - {response.text}")
    except Exception as e:
        logger.error(f"Memory injection failed: {e}")


async def send_notification(
    user_id: int,
    wallet: str,
    label: Optional[str],
    tx: HeliusTransaction
) -> bool:
    """Send transaction notification to user via Telegram."""
    if not bot:
        logger.warning("Bot not initialized, cannot send notification")
        return False

    # Format wallet display
    wallet_display = label or f"{wallet[:4]}...{wallet[-4:]}"

    # Format transaction type
    tx_type = format_transaction_type(tx.type or "UNKNOWN")

    # Build detailed message
    lines = [f"🔔 Wallet Activity: {wallet_display}"]
    lines.append(f"")
    lines.append(f"Type: {tx_type}")

    # Description from Helius (human readable)
    if tx.description:
        lines.append(f"Details: {tx.description[:200]}")

    # Native SOL transfers
    if tx.nativeTransfers:
        lines.append("")
        lines.append("SOL Transfers:")
        for transfer in tx.nativeTransfers:
            if transfer.amount and transfer.amount > 0:
                from_addr = format_address(transfer.fromUserAccount)
                to_addr = format_address(transfer.toUserAccount)
                amount = format_sol_amount(transfer.amount)
                lines.append(f"  {from_addr} → {to_addr}: {amount}")

    # Token transfers
    if tx.tokenTransfers:
        lines.append("")
        lines.append("Token Transfers:")
        for transfer in tx.tokenTransfers:
            if transfer.tokenAmount and transfer.tokenAmount > 0:
                from_addr = format_address(transfer.fromUserAccount)
                to_addr = format_address(transfer.toUserAccount)
                mint = format_address(transfer.mint) if transfer.mint else "?"
                lines.append(f"  {from_addr} → {to_addr}")
                lines.append(f"  Amount: {transfer.tokenAmount:.6g} (mint: {mint})")

    # Fee
    if tx.fee:
        lines.append("")
        lines.append(f"Fee: {format_sol_amount(tx.fee)}")

    # Timestamp
    if tx.timestamp:
        lines.append(f"Time: {format_timestamp(tx.timestamp)}")

    # Full signature (copyable)
    lines.append("")
    lines.append(f"Tx: `{tx.signature}`")
    lines.append(f"🔗 https://solscan.io/tx/{tx.signature}")

    message = "\n".join(lines)

    try:
        await bot.send_message(
            chat_id=user_id,
            text=message,
            parse_mode="Markdown",
            disable_web_page_preview=True
        )
        logger.info(f"Sent notification to user {user_id} for wallet {wallet[:8]}...")

        # Inject memory so agent recalls this notification
        memory_text = f"Sent wallet alert: {wallet_display} did a {tx_type}"
        if tx.description:
            memory_text += f" - {tx.description[:100]}"
        memory_text += f" (tx: {tx.signature[:16]}...)"

        await inject_memory(
            user_id=user_id,
            memory_text=memory_text,
            topics=["wallet_alerts", "notifications", tx_type.replace(" ", "_")]
        )

        return True
    except Exception as e:
        logger.error(f"Failed to send notification to {user_id}: {e}")
        return False


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "webhook-receiver"}


@app.get("/debug/db")
async def debug_db():
    """Debug endpoint to check database state."""
    db = SessionLocal()
    try:
        from db.models import UserProfile

        users = db.query(UserProfile).count()
        alerts = db.query(WalletAlert).all()

        return {
            "database_url": DATABASE_URL[:50] + "..." if DATABASE_URL else "not set",
            "total_users": users,
            "total_alerts": len(alerts),
            "alerts": [
                {
                    "id": a.id,
                    "user_id": a.user_id,
                    "wallet": a.watched_wallet,
                    "label": a.wallet_label,
                    "active": a.is_active
                }
                for a in alerts
            ]
        }
    finally:
        db.close()


@app.post("/webhook/helius")
async def receive_helius_webhook(
    request: Request,
    authorization: Optional[str] = Header(None)
):
    """
    Receive transaction webhooks from Helius.
    Looks up watching users and sends Telegram notifications.
    """
    # Verify auth header if configured
    if HELIUS_WEBHOOK_AUTH and authorization != HELIUS_WEBHOOK_AUTH:
        logger.warning("Unauthorized webhook request")
        raise HTTPException(status_code=401, detail="Unauthorized")

    try:
        # Parse payload (Helius sends array of transactions)
        payload = await request.json()

        # Handle both single transaction and array
        transactions = payload if isinstance(payload, list) else [payload]

        logger.info(f"Received {len(transactions)} transaction(s) from Helius")
        logger.info(f"Raw payload keys: {list(transactions[0].keys()) if transactions else 'empty'}")

        db = SessionLocal()
        try:
            # Log total alerts in database
            total_alerts = db.query(WalletAlert).count()
            active_alerts = db.query(WalletAlert).filter(WalletAlert.is_active == True).count()
            logger.info(f"Database has {total_alerts} total alerts, {active_alerts} active")

            # Log all active watched wallets
            all_watched = db.query(WalletAlert).filter(WalletAlert.is_active == True).all()
            for alert in all_watched:
                logger.info(f"  Watching: {alert.watched_wallet[:12]}... (user_id={alert.user_id})")

            for tx_data in transactions:
                try:
                    tx = HeliusTransaction(**tx_data)
                    logger.info(f"Parsed tx: sig={tx.signature[:12]}... type={tx.type} feePayer={tx.feePayer[:12] if tx.feePayer else 'None'}...")
                except Exception as e:
                    logger.warning(f"Failed to parse transaction: {e}")
                    logger.warning(f"Transaction data keys: {list(tx_data.keys())}")
                    continue

                # Extract all accounts involved
                accounts = extract_accounts(tx)
                logger.info(f"Transaction {tx.signature[:12]}... involves {len(accounts)} accounts:")
                for acc in accounts[:10]:  # Log first 10 accounts
                    logger.info(f"  Account: {acc}")
                if len(accounts) > 10:
                    logger.info(f"  ... and {len(accounts) - 10} more accounts")

                # Find all users watching any of these accounts
                logger.info(f"Querying for watchers of {len(accounts)} accounts...")
                watchers = db.query(WalletAlert).filter(
                    WalletAlert.watched_wallet.in_(accounts),
                    WalletAlert.is_active == True
                ).all()

                logger.info(f"Found {len(watchers)} watcher(s) for transaction")

                if len(watchers) == 0:
                    logger.warning("No watchers found! Check if watched wallet is in the accounts list above.")

                # Send notification to each watcher
                for alert in watchers:
                    logger.info(f"Sending notification to user_id={alert.user_id} for wallet={alert.watched_wallet[:12]}...")
                    result = await send_notification(
                        user_id=alert.user_id,
                        wallet=alert.watched_wallet,
                        label=alert.wallet_label,
                        tx=tx
                    )
                    logger.info(f"Notification result: {'success' if result else 'failed'}")
        finally:
            db.close()

        return {"status": "ok", "processed": len(transactions)}

    except Exception as e:
        logger.error(f"Error processing webhook: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
