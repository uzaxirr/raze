"""Jupiter aggregator API client for token swaps (v2 Meta-Aggregator)."""
import os
import logging
from pathlib import Path
from typing import Dict, Any, Optional

import httpx
from dotenv import load_dotenv
from solders.pubkey import Pubkey

# Load from project root
_root = Path(__file__).resolve().parent
while not (_root / '.env').exists() and _root != _root.parent:
    _root = _root.parent
load_dotenv(_root / '.env')

logger = logging.getLogger(__name__)

# Jupiter API v2
JUPITER_API_URL = os.getenv("JUPITER_API_URL", "https://api.jup.ag/swap/v2")
JUPITER_API_KEY = os.getenv("JUPITER_API_KEY", "")

# Raze referral account for swap fees
RAZE_REFERRAL_ACCOUNT = os.getenv("RAZE_REFERRAL_ACCOUNT", "2sZdpSqnggDWj1xMfrytd4Pum34wBjVW7KtyuknRgkGZ")
RAZE_REFERRAL_FEE_BPS = int(os.getenv("RAZE_REFERRAL_FEE_BPS", "200"))  # 2% (Raze keeps 80% = 1.6%)

# Jupiter Referral Program ID
REFERRAL_PROGRAM_ID = Pubkey.from_string("REFER4ZgmyYx9c6He5XfaTMiGfdLwRnkV4RPp9t9iF3")


def derive_referral_fee_account(referral_account: str, fee_mint: str) -> str:
    """Derive the referral fee token account PDA for a given mint."""
    referral_pubkey = Pubkey.from_string(referral_account)
    mint_pubkey = Pubkey.from_string(fee_mint)
    pda, _ = Pubkey.find_program_address(
        [b"referral_ata", bytes(referral_pubkey), bytes(mint_pubkey)],
        REFERRAL_PROGRAM_ID,
    )
    return str(pda)


def _headers() -> Dict[str, str]:
    """Common headers for Jupiter API requests."""
    h = {"Content-Type": "application/json"}
    if JUPITER_API_KEY:
        h["x-api-key"] = JUPITER_API_KEY
    return h


class JupiterClient:
    """Jupiter v2 Meta-Aggregator API client for Solana token swaps."""

    def __init__(self, api_url: Optional[str] = None):
        self.api_url = api_url or JUPITER_API_URL

    async def get_swap_quote_and_transaction(
        self,
        input_mint: str,
        output_mint: str,
        amount: int,
        user_public_key: str,
        slippage_bps: int = 50,
    ) -> Dict[str, Any]:
        """
        Get quote + assembled unsigned transaction via /order.

        Args:
            input_mint: Input token mint address
            output_mint: Output token mint address
            amount: Amount in smallest units (lamports)
            user_public_key: User's wallet address (taker)
            slippage_bps: Slippage tolerance in basis points

        Returns:
            Dict with quote info, unsigned transaction, and requestId
        """
        url = f"{self.api_url}/order"

        params = {
            "inputMint": input_mint,
            "outputMint": output_mint,
            "amount": str(amount),
            "slippageBps": slippage_bps,
            "taker": user_public_key,
        }

        if RAZE_REFERRAL_ACCOUNT:
            params["referralAccount"] = RAZE_REFERRAL_ACCOUNT
            params["referralFee"] = str(RAZE_REFERRAL_FEE_BPS)

        logger.info(f"Getting Jupiter order: {input_mint} -> {output_mint}, amount={amount}, taker={user_public_key}")

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, params=params, headers=_headers())

            if response.status_code != 200:
                error_detail = response.text
                logger.error(f"Jupiter order error: {response.status_code} - {error_detail}")
                raise Exception(f"Failed to get Jupiter order: {error_detail}")

            result = response.json()

            swap_transaction = result.get("transaction")
            request_id = result.get("requestId")
            in_amount = result.get("inAmount", "0")
            out_amount = result.get("outAmount", "0")

            if not swap_transaction:
                raise Exception(f"No transaction in Jupiter order response: {result}")

            logger.info(f"Got order: {in_amount} -> {out_amount}, requestId={request_id}")

            return {
                "quote": result,
                "input_amount": int(in_amount),
                "output_amount": int(out_amount),
                "price_impact_pct": result.get("priceImpactPct"),
                "swap_transaction": swap_transaction,
                "request_id": request_id,
            }

    async def execute_signed_transaction(
        self,
        signed_transaction: str,
        request_id: str,
    ) -> Dict[str, Any]:
        """
        Submit a signed transaction to Jupiter for landing via /execute.

        Args:
            signed_transaction: Base64-encoded signed transaction
            request_id: The requestId from the /order response

        Returns:
            Dict with transaction signature and status
        """
        url = f"{self.api_url}/execute"

        payload = {
            "signedTransaction": signed_transaction,
            "requestId": request_id,
        }

        logger.info(f"Executing swap via Jupiter, requestId={request_id}")

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(url, json=payload, headers=_headers())

            if response.status_code != 200:
                error_detail = response.text
                logger.error(f"Jupiter execute error: {response.status_code} - {error_detail}")
                raise Exception(f"Failed to execute swap: {error_detail}")

            result = response.json()
            signature = result.get("signature")

            if not signature:
                raise Exception(f"No signature in Jupiter execute response: {result}")

            logger.info(f"Swap executed: {signature}")
            return {
                "signature": signature,
                "status": "confirmed",
            }
