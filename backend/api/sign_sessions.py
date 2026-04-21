"""V2 signing sessions API — intent-based, PostgreSQL-backed."""
import os
import json
import uuid
import hashlib
import secrets
import logging
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Optional

import httpx
from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.database import SessionLocal
from db.models import SignSession, SignSessionEvent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/sign", tags=["signing"])

# ── Config ──
RAZE_SIGN_SECRET = os.getenv("RAZE_SIGN_SECRET")
if not RAZE_SIGN_SECRET:
    logger.warning("RAZE_SIGN_SECRET not set — session creation will fail")

JUPITER_API_KEY = os.getenv("JUPITER_API_KEY", "")
JUPITER_V2_URL = os.getenv("JUPITER_API_URL", "https://api.jup.ag/swap/v2")
JUPITER_V1_URL = "https://api.jup.ag/swap/v1"
SOLANA_RPC_URL = os.getenv("SOLANA_RPC_URL", os.getenv("NEXT_PUBLIC_SOLANA_RPC_URL", "https://api.mainnet-beta.solana.com"))
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")

# Referral accounts
ULTRA_REFERRAL_ACCOUNT = os.getenv("RAZE_REFERRAL_ACCOUNT", "5JZe6rRbXoDjxcie4JLemUdXYsJk2k5L1TA1yekNGqKw")
SWAP_TRIGGER_REFERRAL_ACCOUNT = "2sZdpSqnggDWj1xMfrytd4Pum34wBjVW7KtyuknRgkGZ"
REFERRAL_FEE_BPS = int(os.getenv("RAZE_REFERRAL_FEE_BPS", "200"))
TRANSFER_FEE_BPS = int(os.getenv("RAZE_TRANSFER_FEE_BPS", "100"))

SESSION_TTL_MINUTES = 10

# Token mints
MINTS = {
    "SOL": "So11111111111111111111111111111111111111112",
    "USDC": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "USDT": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    "BONK": "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    "JUP": "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    "JLP": "27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4",
    "WIF": "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
}
DECIMALS = {"SOL": 9, "USDC": 6, "USDT": 6, "BONK": 5, "JUP": 6, "JLP": 6, "WIF": 6}

REFERRAL_PROGRAM_ID = "REFER4ZgmyYx9c6He5XfaTMiGfdLwRnkV4RPp9t9iF3"


# ── Helpers ──

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _verify_sign_secret(request: Request):
    if not RAZE_SIGN_SECRET:
        raise HTTPException(500, "RAZE_SIGN_SECRET not configured")
    secret = request.headers.get("x-sign-secret")
    if secret != RAZE_SIGN_SECRET:
        raise HTTPException(401, "unauthorized")


def _verify_viewer_token(session: SignSession, token: Optional[str]):
    if not token:
        raise HTTPException(401, "missing viewer token")
    if _hash_token(token) != session.viewer_token_hash:
        raise HTTPException(403, "invalid viewer token")


def _expires_utc(dt: datetime) -> datetime:
    """Ensure datetime is timezone-aware (UTC)."""
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt


def _get_session(db: Session, session_id: str) -> SignSession:
    session = db.query(SignSession).filter(SignSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "session not found")
    if _expires_utc(session.expires_at) < datetime.now(timezone.utc):
        raise HTTPException(410, "session expired")
    return session


def _log_event(db: Session, session_id: str, event: str, data: dict = None):
    ev = SignSessionEvent(
        session_id=session_id,
        event=event,
        data=json.dumps(data) if data else None,
    )
    db.add(ev)
    db.commit()


def _resolve_mint(symbol: str) -> Optional[str]:
    return MINTS.get(symbol.upper())


def _to_smallest_units(amount: float, symbol: str) -> int:
    decimals = DECIMALS.get(symbol.upper(), 9)
    return round(amount * (10 ** decimals))


def _jup_headers() -> dict:
    h = {"Content-Type": "application/json"}
    if JUPITER_API_KEY:
        h["x-api-key"] = JUPITER_API_KEY
    return h


def _derive_fee_account_pda(referral_account: str, mint: str) -> str:
    """Derive referral fee token account PDA."""
    from solders.pubkey import Pubkey
    ref_pk = Pubkey.from_string(referral_account)
    mint_pk = Pubkey.from_string(mint)
    program_pk = Pubkey.from_string(REFERRAL_PROGRAM_ID)
    pda, _ = Pubkey.find_program_address(
        [b"referral_ata", bytes(ref_pk), bytes(mint_pk)],
        program_pk,
    )
    return str(pda)


def _cors_response(data: dict, status: int = 200) -> JSONResponse:
    return JSONResponse(
        content=data,
        status_code=status,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    )


async def _notify_telegram(chat_id: int, tx_type: str, from_sym: str, to_sym: str,
                           input_amt, output_amt, tx_hash: str):
    if not TELEGRAM_BOT_TOKEN or not chat_id:
        return
    try:
        type_label = "Swap" if tx_type == "swap" else "Transfer"
        detail = f"{input_amt} {from_sym} → {output_amt} {to_sym}" if tx_type == "swap" else f"{input_amt} {from_sym}"
        solscan = f"https://solscan.io/tx/{tx_hash}" if tx_hash else ""
        message = (
            f"✅ *{type_label} confirmed!*\n"
            f"{detail}\n"
            f"[View on Solscan]({solscan})" if solscan else ""
        )
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": message,
                    "parse_mode": "Markdown",
                    "disable_web_page_preview": True,
                },
            )
    except Exception as e:
        logger.warning(f"Failed to notify Telegram: {e}")


# ── Request Models ──

class CreateSessionRequest(BaseModel):
    type: str  # swap | sol_transfer | token_transfer
    walletAddress: Optional[str] = None
    fromToken: Optional[str] = None
    toToken: Optional[str] = None
    amount: float
    toAddress: Optional[str] = None
    slippageBps: int = 50
    network: str = "mainnet"
    telegramChatId: Optional[int] = None


class BuildRequest(BaseModel):
    walletAddress: str


class SubmitRequest(BaseModel):
    signedTransaction: str
    requestId: Optional[str] = None


# ── Endpoints ──

@router.post("/sessions")
async def create_session(body: CreateSessionRequest, request: Request, db: Session = Depends(get_db)):
    """Create an intent-based signing session. Called by the bot."""
    _verify_sign_secret(request)

    session_id = str(uuid.uuid4())
    viewer_token = secrets.token_urlsafe(32)
    # Generate a proper Solana public key for on-chain detection via findReference
    from solders.keypair import Keypair as SoldersKeypair
    ref_keypair = SoldersKeypair()
    reference_key = str(ref_keypair.pubkey())

    session = SignSession(
        id=session_id,
        viewer_token_hash=_hash_token(viewer_token),
        type=body.type,
        wallet_address=body.walletAddress,
        from_token=body.fromToken,
        to_token=body.toToken,
        amount=Decimal(str(body.amount)),
        to_address=body.toAddress,
        slippage_bps=body.slippageBps,
        network=body.network,
        reference_key=reference_key,
        telegram_chat_id=body.telegramChatId,
        status="pending",
        from_symbol=body.fromToken,
        to_symbol=body.toToken,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=SESSION_TTL_MINUTES),
    )
    db.add(session)
    db.commit()
    _log_event(db, session_id, "created", {"type": body.type, "amount": body.amount})

    return {
        "sessionId": session_id,
        "viewerToken": viewer_token,
        "expiresAt": int(session.expires_at.timestamp() * 1000),
    }


@router.get("/sessions/{session_id}")
async def get_session(session_id: str, t: Optional[str] = None, db: Session = Depends(get_db)):
    """Get session intent for the sign page."""
    session = _get_session(db, session_id)
    _verify_viewer_token(session, t)

    return {
        "id": session.id,
        "type": session.type,
        "walletAddress": session.wallet_address,
        "fromToken": session.from_token,
        "toToken": session.to_token,
        "amount": float(session.amount),
        "toAddress": session.to_address,
        "slippageBps": session.slippage_bps,
        "network": session.network,
        "status": session.status,
        "expiresAt": int(session.expires_at.timestamp() * 1000),
        "referenceKey": session.reference_key,
        "fromSymbol": session.from_symbol,
        "toSymbol": session.to_symbol,
        "outputAmount": float(session.output_amount) if session.output_amount else None,
        "priceImpact": session.price_impact,
        "feeAmount": float(session.fee_amount) if session.fee_amount else None,
        "feeBps": session.fee_bps,
        "txHash": session.tx_hash,
    }


@router.post("/sessions/{session_id}/build")
async def build_transaction(session_id: str, body: BuildRequest, t: Optional[str] = None, db: Session = Depends(get_db)):
    """Build a fresh transaction at sign time. Called by the sign page."""
    session = _get_session(db, session_id)
    _verify_viewer_token(session, t)

    if session.status not in ("pending", "building"):
        raise HTTPException(409, f"session status is {session.status}, cannot build")

    if session.type == "swap":
        return await _build_swap(session, body.walletAddress, db)
    else:
        raise HTTPException(400, f"build not yet implemented for {session.type}")


async def _build_swap(session: SignSession, wallet_address: str, db: Session):
    """Build fresh swap tx via Jupiter v2 /order."""
    input_mint = _resolve_mint(session.from_token) if session.from_token else None
    output_mint = _resolve_mint(session.to_token) if session.to_token else None

    if not input_mint or not output_mint:
        raise HTTPException(400, f"unknown token: {session.from_token} or {session.to_token}")

    amount = _to_smallest_units(float(session.amount), session.from_token)

    params = {
        "inputMint": input_mint,
        "outputMint": output_mint,
        "amount": str(amount),
        "slippageBps": session.slippage_bps,
        "taker": wallet_address,
        "referralAccount": ULTRA_REFERRAL_ACCOUNT,
        "referralFee": str(REFERRAL_FEE_BPS),
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(f"{JUPITER_V2_URL}/order", params=params, headers=_jup_headers())

    if resp.status_code != 200:
        logger.error(f"Jupiter /order failed: {resp.status_code} {resp.text}")
        raise HTTPException(502, f"Jupiter error: {resp.text[:200]}")

    result = resp.json()
    tx = result.get("transaction")
    request_id = result.get("requestId")

    if not tx:
        raise HTTPException(502, "no transaction from Jupiter")

    out_amount = result.get("outAmount", "0")
    in_amount = result.get("inAmount", "0")
    out_decimals = DECIMALS.get(session.to_token.upper(), 9) if session.to_token else 9
    output_human = int(out_amount) / (10 ** out_decimals)

    # Update session
    session.status = "building"
    session.execution_mode = "managed_execute"
    session.output_amount = Decimal(str(output_human))
    session.price_impact = result.get("priceImpactPct") or result.get("priceImpact")
    session.fee_bps = REFERRAL_FEE_BPS
    platform_fee = result.get("platformFee", {})
    if platform_fee and platform_fee.get("amount"):
        fee_amt = int(platform_fee["amount"]) / (10 ** out_decimals)
        session.fee_amount = Decimal(str(fee_amt))
    db.commit()

    _log_event(db, session.id, "tx_built", {"requestId": request_id, "outputAmount": output_human})

    return {
        "unsignedTransaction": tx,
        "requestId": request_id,
        "outputAmount": output_human,
        "priceImpact": session.price_impact,
        "feeBps": REFERRAL_FEE_BPS,
        "feeAmount": float(session.fee_amount) if session.fee_amount else None,
    }


@router.post("/sessions/{session_id}/submit")
async def submit_transaction(session_id: str, body: SubmitRequest, t: Optional[str] = None, db: Session = Depends(get_db)):
    """Submit signed transaction. Server calls Jupiter /execute."""
    session = _get_session(db, session_id)
    _verify_viewer_token(session, t)

    if session.status not in ("building", "signing"):
        raise HTTPException(409, f"session status is {session.status}, cannot submit")

    session.status = "submitted"
    db.commit()

    try:
        if body.requestId:
            # Swap: Jupiter /execute
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(
                    f"{JUPITER_V2_URL}/execute",
                    json={
                        "signedTransaction": body.signedTransaction,
                        "requestId": body.requestId,
                    },
                    headers=_jup_headers(),
                )

            if resp.status_code != 200:
                logger.error(f"Jupiter /execute failed: {resp.status_code} {resp.text}")
                session.status = "failed"
                session.error_message = resp.text[:500]
                db.commit()
                _log_event(db, session.id, "execute_failed", {"error": resp.text[:500]})
                raise HTTPException(502, f"Jupiter execute failed: {resp.text[:200]}")

            result = resp.json()
            signature = result.get("signature")

            if not signature:
                session.status = "failed"
                session.error_message = "no signature from Jupiter"
                db.commit()
                raise HTTPException(502, "no signature from Jupiter /execute")

        else:
            # Send: broadcast directly
            import base64
            tx_bytes = base64.b64decode(body.signedTransaction)
            tx_b64 = base64.b64encode(tx_bytes).decode()

            async with httpx.AsyncClient(timeout=30) as client:
                rpc_resp = await client.post(
                    SOLANA_RPC_URL,
                    json={
                        "jsonrpc": "2.0",
                        "id": 1,
                        "method": "sendTransaction",
                        "params": [tx_b64, {"encoding": "base64", "skipPreflight": True, "maxRetries": 3}],
                    },
                )

            rpc_result = rpc_resp.json()
            if "error" in rpc_result:
                session.status = "failed"
                session.error_message = str(rpc_result["error"])
                db.commit()
                raise HTTPException(502, f"RPC error: {rpc_result['error']}")

            signature = rpc_result.get("result")

        # Success
        session.status = "confirmed"
        session.tx_hash = signature
        session.confirmed_at = datetime.now(timezone.utc)
        db.commit()

        _log_event(db, session.id, "confirmed", {"signature": signature})

        # Notify bot (fire and forget)
        await _notify_telegram(
            session.telegram_chat_id,
            session.type,
            session.from_symbol or "",
            session.to_symbol or "",
            float(session.amount),
            float(session.output_amount) if session.output_amount else None,
            signature,
        )

        return {"signature": signature, "status": "confirmed"}

    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Submit failed: {e}")
        session.status = "failed"
        session.error_message = str(e)[:500]
        db.commit()
        _log_event(db, session.id, "failed", {"error": str(e)[:500]})
        raise HTTPException(500, f"submit failed: {str(e)[:200]}")


@router.get("/sessions/{session_id}/status")
async def get_status(session_id: str, t: Optional[str] = None, db: Session = Depends(get_db)):
    """Poll for transaction confirmation."""
    session = _get_session(db, session_id)
    # Status polling doesn't strictly need auth, but accept it
    if t:
        _verify_viewer_token(session, t)

    if session.status in ("confirmed", "finalized") and session.tx_hash:
        return {"status": "confirmed", "signature": session.tx_hash}

    if session.status in ("failed",):
        return {"status": "failed", "error": session.error_message}

    # For wallet_broadcast mode: check on-chain via RPC
    if session.execution_mode == "wallet_broadcast" and session.reference_key and session.status in ("signing", "submitted"):
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                rpc_resp = await client.post(
                    SOLANA_RPC_URL,
                    json={
                        "jsonrpc": "2.0",
                        "id": 1,
                        "method": "getSignaturesForAddress",
                        "params": [session.reference_key, {"limit": 1, "commitment": "confirmed"}],
                    },
                )
            result = rpc_resp.json().get("result", [])
            if result:
                sig = result[0].get("signature")
                session.status = "confirmed"
                session.tx_hash = sig
                session.confirmed_at = datetime.now(timezone.utc)
                db.commit()
                _log_event(db, session.id, "reference_detected", {"signature": sig})

                await _notify_telegram(
                    session.telegram_chat_id,
                    session.type,
                    session.from_symbol or "",
                    session.to_symbol or "",
                    float(session.amount),
                    float(session.output_amount) if session.output_amount else None,
                    sig,
                )

                return {"status": "confirmed", "signature": sig}
        except Exception as e:
            logger.warning(f"Status poll RPC error: {e}")

    return {"status": "pending"}


# ── Solana Pay Endpoints ──

@router.options("/sessions/{session_id}/pay")
async def pay_options():
    return _cors_response({})


@router.get("/sessions/{session_id}/pay")
async def pay_get(session_id: str, db: Session = Depends(get_db)):
    """Solana Pay GET — wallet requests metadata."""
    session = db.query(SignSession).filter(SignSession.id == session_id).first()
    if not session or _expires_utc(session.expires_at) < datetime.now(timezone.utc):
        return _cors_response({"error": "session expired"}, 404)

    if session.type == "swap":
        label = f"Swap {float(session.amount)} {session.from_symbol or session.from_token} → {session.to_symbol or session.to_token}"
    elif session.type == "sol_transfer":
        label = f"Send {float(session.amount)} SOL"
    else:
        label = f"Send {float(session.amount)} {session.from_symbol or session.from_token or 'tokens'}"

    return _cors_response({
        "label": label,
        "icon": "https://raze.fun/assets/imp-expressions/waving.png",
    })


@router.post("/sessions/{session_id}/pay")
async def pay_post(session_id: str, request: Request, db: Session = Depends(get_db)):
    """Solana Pay POST — build fresh LEGACY transaction for wallet broadcast."""
    session = db.query(SignSession).filter(SignSession.id == session_id).first()
    if not session or _expires_utc(session.expires_at) < datetime.now(timezone.utc):
        return _cors_response({"error": "session expired"}, 404)

    if session.status == "confirmed":
        return _cors_response({"error": "already signed"}, 410)

    body = await request.json()
    account = body.get("account")
    if not account:
        return _cors_response({"error": "missing account"}, 400)

    try:
        if session.type == "swap" and session.from_token and session.to_token:
            tx_b64, label = await _build_solanapay_swap(session, account, db)
        else:
            return _cors_response({"error": "Solana Pay not supported for this transaction type"}, 400)

        # Update session
        session.execution_mode = "wallet_broadcast"
        session.status = "signing"
        db.commit()
        _log_event(db, session.id, "tx_built_solanapay", {"account": account})

        return _cors_response({"transaction": tx_b64, "message": f"Raze: {label}"})

    except Exception as e:
        logger.exception(f"Solana Pay build failed: {e}")
        return _cors_response({"error": str(e)[:200]}, 500)


async def _build_solanapay_swap(session: SignSession, account: str, db: Session) -> tuple[str, str]:
    """Build fresh LEGACY swap tx via Jupiter v1 with fees."""
    input_mint = _resolve_mint(session.from_token)
    output_mint = _resolve_mint(session.to_token)

    if not input_mint or not output_mint:
        raise ValueError(f"unknown token: {session.from_token} or {session.to_token}")

    amount = _to_smallest_units(float(session.amount), session.from_token)

    # Step 1: Fresh quote with platform fee
    quote_params = {
        "inputMint": input_mint,
        "outputMint": output_mint,
        "amount": str(amount),
        "slippageBps": str(session.slippage_bps),
        "platformFeeBps": str(REFERRAL_FEE_BPS),
    }

    headers = {}
    if JUPITER_API_KEY:
        headers["x-api-key"] = JUPITER_API_KEY

    async with httpx.AsyncClient(timeout=30) as client:
        quote_resp = await client.get(f"{JUPITER_V1_URL}/quote", params=quote_params, headers=headers)

    if quote_resp.status_code != 200:
        raise ValueError(f"Jupiter quote failed: {quote_resp.text[:200]}")

    quote = quote_resp.json()

    # Derive fee account PDA for output mint
    fee_account = _derive_fee_account_pda(SWAP_TRIGGER_REFERRAL_ACCOUNT, output_mint)

    # Step 2: Fresh swap transaction (LEGACY)
    swap_body = {
        "quoteResponse": quote,
        "userPublicKey": account,
        "wrapAndUnwrapSol": True,
        "dynamicComputeUnitLimit": True,
        "asLegacyTransaction": True,
        "prioritizationFeeLamports": "auto",
        "feeAccount": fee_account,
    }

    # Add trackingAccount for reference key (on-chain detection)
    if session.reference_key:
        swap_body["trackingAccount"] = session.reference_key

    async with httpx.AsyncClient(timeout=30) as client:
        swap_resp = await client.post(
            f"{JUPITER_V1_URL}/swap",
            json=swap_body,
            headers={"Content-Type": "application/json", **headers},
        )

    if swap_resp.status_code != 200:
        raise ValueError(f"Jupiter swap failed: {swap_resp.text[:200]}")

    swap_data = swap_resp.json()
    tx_b64 = swap_data.get("swapTransaction")

    if not tx_b64:
        raise ValueError("no swapTransaction in Jupiter response")

    # Update display metadata
    out_amount = int(quote.get("outAmount", "0"))
    out_decimals = DECIMALS.get(session.to_token.upper(), 9)
    output_human = out_amount / (10 ** out_decimals)
    session.output_amount = Decimal(str(output_human))
    session.fee_bps = REFERRAL_FEE_BPS
    db.commit()

    label = f"Swap {float(session.amount)} {session.from_symbol} → {session.to_symbol}"
    return tx_b64, label
