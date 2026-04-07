"""Privy API client for signing and sending Solana transactions."""
import base64
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

# Privy API configuration
PRIVY_API_URL = "https://api.privy.io/v1"

# Solana mainnet CAIP-2 identifier
SOLANA_MAINNET_CAIP2 = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"
SOLANA_DEVNET_CAIP2 = "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1"


class PrivySigner:
    """Privy API client for signing Solana transactions."""

    def __init__(
        self,
        app_id: Optional[str] = None,
        app_secret: Optional[str] = None,
        network: str = "mainnet",
    ):
        """
        Initialize the Privy signer.

        Args:
            app_id: Privy app ID (defaults to PRIVY_APP_ID env var)
            app_secret: Privy app secret (defaults to PRIVY_APP_SECRET env var)
            network: "mainnet" or "devnet"
        """
        self.app_id = app_id or os.getenv("PRIVY_APP_ID")
        self.app_secret = app_secret or os.getenv("PRIVY_APP_SECRET")

        if not self.app_id or not self.app_secret:
            raise ValueError(
                "PRIVY_APP_ID and PRIVY_APP_SECRET are required. "
                "Set them in environment or pass to constructor."
            )

        self.caip2 = SOLANA_MAINNET_CAIP2 if network == "mainnet" else SOLANA_DEVNET_CAIP2

        # Create auth header (Basic auth with base64 encoded credentials)
        credentials = f"{self.app_id}:{self.app_secret}"
        self.auth_header = base64.b64encode(credentials.encode()).decode()

    def _get_headers(self) -> Dict[str, str]:
        """Get headers for Privy API requests."""
        return {
            "Authorization": f"Basic {self.auth_header}",
            "privy-app-id": self.app_id,
            "Content-Type": "application/json",
        }

    async def sign_and_send_transaction(
        self,
        wallet_id: str,
        transaction_base64: str,
        sponsor: bool = False,
    ) -> Dict[str, Any]:
        """
        Sign and send a Solana transaction via Privy.

        Args:
            wallet_id: Privy wallet ID
            transaction_base64: Base64-encoded serialized transaction
            sponsor: Whether to sponsor the transaction (pay gas fees)

        Returns:
            Dict with transaction hash and details

        Raises:
            Exception: If signing/sending fails
        """
        url = f"{PRIVY_API_URL}/wallets/{wallet_id}/rpc"

        payload = {
            "method": "signAndSendTransaction",
            "caip2": self.caip2,
            "params": {
                "transaction": transaction_base64,
                "encoding": "base64",
            },
        }

        if sponsor:
            payload["sponsor"] = True

        logger.info(f"Signing transaction for wallet {wallet_id}")
        logger.debug(f"Transaction (first 100 chars): {transaction_base64[:100]}...")

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                url,
                headers=self._get_headers(),
                json=payload,
            )

            if response.status_code != 200:
                error_detail = response.text
                logger.error(f"Privy API error: {response.status_code} - {error_detail}")
                raise Exception(f"Privy signing failed: {response.status_code} - {error_detail}")

            result = response.json()

            if "data" in result and "hash" in result["data"]:
                tx_hash = result["data"]["hash"]
                logger.info(f"Transaction sent successfully: {tx_hash}")
                # Use devnet explorer if on devnet
                cluster_param = "?cluster=devnet" if self.caip2 == SOLANA_DEVNET_CAIP2 else ""
                return {
                    "status": "success",
                    "signature": tx_hash,
                    "explorer_url": f"https://solscan.io/tx/{tx_hash}{cluster_param}",
                }
            else:
                logger.error(f"Unexpected Privy response: {result}")
                raise Exception(f"Unexpected Privy response: {result}")

    async def get_wallet(self, wallet_id: str) -> Dict[str, Any]:
        """
        Get wallet details from Privy.

        Args:
            wallet_id: Privy wallet ID

        Returns:
            Wallet details including address
        """
        url = f"{PRIVY_API_URL}/wallets/{wallet_id}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                url,
                headers=self._get_headers(),
            )

            if response.status_code != 200:
                raise Exception(f"Failed to get wallet: {response.status_code} - {response.text}")

            return response.json()

    async def get_wallet_address(self, wallet_id: str) -> str:
        """
        Get the public address for a wallet.

        Args:
            wallet_id: Privy wallet ID

        Returns:
            Wallet public address
        """
        wallet = await self.get_wallet(wallet_id)
        return wallet.get("address")
