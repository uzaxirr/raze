"""Jupiter aggregator API client for token swaps."""
import os
import logging
from pathlib import Path
from typing import Dict, Any, Optional

import httpx
from dotenv import load_dotenv

# Load from project root
_root = Path(__file__).resolve().parent
while not (_root / '.env').exists() and _root != _root.parent:
    _root = _root.parent
load_dotenv(_root / '.env')

logger = logging.getLogger(__name__)

# Jupiter API endpoints
JUPITER_API_URL = os.getenv("JUPITER_API_URL", "https://quote-api.jup.ag/v6")


class JupiterClient:
    """Jupiter aggregator API client for Solana token swaps."""

    def __init__(self, api_url: Optional[str] = None):
        """
        Initialize the Jupiter client.

        Args:
            api_url: Jupiter API base URL (defaults to env var or public endpoint)
        """
        self.api_url = api_url or JUPITER_API_URL

    async def get_quote(
        self,
        input_mint: str,
        output_mint: str,
        amount: int,
        slippage_bps: int = 50,
        swap_mode: str = "ExactIn",
    ) -> Dict[str, Any]:
        """
        Get a swap quote from Jupiter.

        Args:
            input_mint: Input token mint address
            output_mint: Output token mint address
            amount: Amount in smallest units (lamports)
            slippage_bps: Slippage tolerance in basis points (50 = 0.5%)
            swap_mode: "ExactIn" or "ExactOut"

        Returns:
            Quote response with routing info and expected output
        """
        url = f"{self.api_url}/quote"
        params = {
            "inputMint": input_mint,
            "outputMint": output_mint,
            "amount": str(amount),
            "slippageBps": slippage_bps,
            "swapMode": swap_mode,
        }

        logger.info(f"Getting Jupiter quote: {input_mint} -> {output_mint}, amount={amount}")

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, params=params)

            if response.status_code != 200:
                error_detail = response.text
                logger.error(f"Jupiter quote error: {response.status_code} - {error_detail}")
                raise Exception(f"Failed to get Jupiter quote: {error_detail}")

            quote = response.json()
            logger.info(f"Got quote: {quote.get('inAmount')} -> {quote.get('outAmount')}")
            return quote

    async def get_swap_transaction(
        self,
        quote: Dict[str, Any],
        user_public_key: str,
        wrap_unwrap_sol: bool = True,
        fee_account: Optional[str] = None,
        compute_unit_price_micro_lamports: Optional[int] = None,
    ) -> str:
        """
        Get an unsigned swap transaction from Jupiter.

        Args:
            quote: Quote response from get_quote()
            user_public_key: User's wallet address
            wrap_unwrap_sol: Auto wrap/unwrap SOL
            fee_account: Optional fee account for referral fees
            compute_unit_price_micro_lamports: Priority fee in micro-lamports

        Returns:
            Base64-encoded unsigned transaction
        """
        url = f"{self.api_url}/swap"

        payload = {
            "quoteResponse": quote,
            "userPublicKey": user_public_key,
            "wrapAndUnwrapSol": wrap_unwrap_sol,
            "dynamicComputeUnitLimit": True,
        }

        if fee_account:
            payload["feeAccount"] = fee_account

        if compute_unit_price_micro_lamports:
            payload["computeUnitPriceMicroLamports"] = compute_unit_price_micro_lamports

        logger.info(f"Getting swap transaction for {user_public_key}")

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)

            if response.status_code != 200:
                error_detail = response.text
                logger.error(f"Jupiter swap error: {response.status_code} - {error_detail}")
                raise Exception(f"Failed to get swap transaction: {error_detail}")

            result = response.json()
            swap_transaction = result.get("swapTransaction")

            if not swap_transaction:
                raise Exception(f"No swap transaction in response: {result}")

            logger.info("Got swap transaction successfully")
            return swap_transaction

    async def get_swap_quote_and_transaction(
        self,
        input_mint: str,
        output_mint: str,
        amount: int,
        user_public_key: str,
        slippage_bps: int = 50,
    ) -> Dict[str, Any]:
        """
        Get both quote and swap transaction in one call.

        Args:
            input_mint: Input token mint address
            output_mint: Output token mint address
            amount: Amount in the smallest units
            user_public_key: User's wallet address
            slippage_bps: Slippage tolerance in basis points

        Returns:
            Dict with quote info and unsigned transaction
        """
        # Get quote
        quote = await self.get_quote(
            input_mint=input_mint,
            output_mint=output_mint,
            amount=amount,
            slippage_bps=slippage_bps,
        )

        # Get swap transaction
        swap_transaction = await self.get_swap_transaction(
            quote=quote,
            user_public_key=user_public_key,
        )

        return {
            "quote": quote,
            "input_amount": int(quote.get("inAmount", 0)),
            "output_amount": int(quote.get("outAmount", 0)),
            "price_impact_pct": quote.get("priceImpactPct"),
            "swap_transaction": swap_transaction,
        }
