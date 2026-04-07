"""Privy API client for server wallet operations."""

import base64
import logging

import httpx

from .config import config

logger = logging.getLogger(__name__)


class PrivyClient:
    """Client for Privy server wallet API."""

    BASE_URL = "https://api.privy.io/v1"

    def __init__(self):
        """Initialize Privy client with credentials from config."""
        if not config.PRIVY_APP_ID or not config.PRIVY_APP_SECRET:
            raise ValueError("PRIVY_APP_ID and PRIVY_APP_SECRET must be configured")

        # Basic auth: app_id:app_secret
        credentials = f"{config.PRIVY_APP_ID}:{config.PRIVY_APP_SECRET}"
        self.auth_header = base64.b64encode(credentials.encode()).decode()
        self.headers = {
            "Authorization": f"Basic {self.auth_header}",
            "Content-Type": "application/json",
            "privy-app-id": config.PRIVY_APP_ID,
        }

    async def create_solana_wallet(self, idempotency_key: str | None = None) -> dict:
        """Create a new Solana wallet via Privy API.

        Args:
            idempotency_key: Optional key to ensure idempotent wallet creation.
                             If provided, same key will return same wallet within 24h.

        Returns:
            dict with wallet info: id, address, chain_type, created_at, etc.

        Raises:
            httpx.HTTPStatusError: If API call fails.

        Note:
            Solana wallets work on both mainnet and devnet - the network is
            specified at transaction signing time via CAIP-2 identifier.
        """
        headers = self.headers.copy()
        if idempotency_key:
            headers["privy-idempotency-key"] = idempotency_key

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/wallets",
                headers=headers,
                json={"chain_type": "solana"},
                timeout=30.0,
            )
            response.raise_for_status()
            wallet = response.json()
            logger.info(f"Created Solana wallet: {wallet.get('address')}")
            return wallet

    async def get_wallet(self, wallet_id: str) -> dict:
        """Get wallet details by ID.

        Args:
            wallet_id: The Privy wallet ID.

        Returns:
            dict with wallet info.
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/wallets/{wallet_id}",
                headers=self.headers,
                timeout=30.0,
            )
            response.raise_for_status()
            return response.json()
