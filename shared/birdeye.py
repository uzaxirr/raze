"""
Direct Birdeye API client for price fetching.
Used by both MCP servers and the price monitor.
"""
import os
import logging
from pathlib import Path
from typing import Dict, List, Optional
from decimal import Decimal
import httpx
from dotenv import load_dotenv

# Load from project root
_root = Path(__file__).resolve().parent
while not (_root / '.env').exists() and _root != _root.parent:
    _root = _root.parent
load_dotenv(_root / '.env')

logger = logging.getLogger(__name__)

BIRDEYE_API_KEY = os.getenv('BIRDEYE_API_KEY')
BIRDEYE_API_URL = 'https://public-api.birdeye.so'
TIMEOUT = 30


async def get_token_price(token_address: str) -> Optional[Decimal]:
    """
    Get current price for a single token.

    Args:
        token_address: Solana token mint address

    Returns:
        Current price in USD or None if error
    """
    if not BIRDEYE_API_KEY:
        logger.error("BIRDEYE_API_KEY not set")
        return None

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{BIRDEYE_API_URL}/defi/price",
                headers={
                    "X-API-KEY": BIRDEYE_API_KEY,
                    "accept": "application/json",
                    "x-chain": "solana"
                },
                params={"address": token_address},
                timeout=TIMEOUT
            )

            if response.status_code == 200:
                data = response.json()
                price = data.get("data", {}).get("value")
                if price is not None:
                    return Decimal(str(price))
    except Exception as e:
        logger.error(f"Error fetching price for {token_address}: {e}")
    return None


async def get_multi_token_prices(token_addresses: List[str]) -> Dict[str, Optional[Decimal]]:
    """
    Get prices for multiple tokens efficiently.
    Uses Birdeye's multi-price endpoint.

    Args:
        token_addresses: List of Solana token mint addresses

    Returns:
        Dict mapping address -> price (or None if unavailable)
    """
    if not token_addresses:
        return {}

    if not BIRDEYE_API_KEY:
        logger.error("BIRDEYE_API_KEY not set")
        return {addr: None for addr in token_addresses}

    results = {}

    # Birdeye supports comma-separated addresses for batch queries
    # Process in batches of 100 (API limit)
    batch_size = 100

    for i in range(0, len(token_addresses), batch_size):
        batch = token_addresses[i:i + batch_size]
        address_list = ",".join(batch)

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{BIRDEYE_API_URL}/defi/multi_price",
                    headers={
                        "X-API-KEY": BIRDEYE_API_KEY,
                        "accept": "application/json",
                        "x-chain": "solana"
                    },
                    params={"list_address": address_list},
                    timeout=TIMEOUT
                )

                if response.status_code == 200:
                    data = response.json().get("data", {})
                    for addr in batch:
                        price_data = data.get(addr, {})
                        price = price_data.get("value")
                        results[addr] = Decimal(str(price)) if price else None
                else:
                    logger.warning(f"Birdeye multi_price returned {response.status_code}")
                    # Mark batch as failed
                    for addr in batch:
                        results[addr] = None
        except Exception as e:
            logger.error(f"Error fetching batch prices: {e}")
            for addr in batch:
                results[addr] = None

    return results
