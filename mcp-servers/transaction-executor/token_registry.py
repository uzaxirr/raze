"""Token registry with API-based resolution using Birdeye Search."""
import os
import re
import httpx
from functools import lru_cache
from typing import Optional

# API config
BIRDEYE_API_KEY = os.getenv('BIRDEYE_API_KEY')
BIRDEYE_API_URL = 'https://public-api.birdeye.so'

# Well-known tokens for fast fallback (never changes)
WELL_KNOWN_TOKENS = {
    "SOL": "So11111111111111111111111111111111111111112",
    "WSOL": "So11111111111111111111111111111111111111112",
    "USDC": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "USDT": "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
}

# Well-known decimals
WELL_KNOWN_DECIMALS = {
    "SOL": 9,
    "WSOL": 9,
    "USDC": 6,
    "USDT": 6,
}

DEFAULT_DECIMALS = 9


def is_valid_solana_address(address: str) -> bool:
    """Check if a string looks like a valid Solana address (base58, 32-44 chars)."""
    if not address or len(address) < 32 or len(address) > 44:
        return False
    base58_pattern = re.compile(r'^[1-9A-HJ-NP-Za-km-z]+$')
    return bool(base58_pattern.match(address))


@lru_cache(maxsize=500)
def _search_token(symbol: str) -> dict | None:
    """Search Birdeye for token by symbol. Cached."""
    if not BIRDEYE_API_KEY:
        return None

    try:
        with httpx.Client(timeout=10) as client:
            response = client.get(
                f"{BIRDEYE_API_URL}/defi/v3/search",
                headers={
                    "X-API-KEY": BIRDEYE_API_KEY,
                    "x-chain": "solana"
                },
                params={"keyword": symbol, "limit": 1}
            )
            if response.status_code == 200:
                items = response.json().get("data", {}).get("items", [])
                if items:
                    return items[0]
    except Exception:
        pass
    return None


@lru_cache(maxsize=500)
def _get_token_metadata(address: str) -> dict | None:
    """Get token metadata by address from Birdeye. Cached."""
    if not BIRDEYE_API_KEY:
        return None

    try:
        with httpx.Client(timeout=10) as client:
            response = client.get(
                f"{BIRDEYE_API_URL}/defi/v3/token/meta-data/single",
                headers={
                    "X-API-KEY": BIRDEYE_API_KEY,
                    "x-chain": "solana"
                },
                params={"address": address}
            )
            if response.status_code == 200:
                data = response.json().get("data")
                if data:
                    return data
    except Exception:
        pass
    return None


def resolve_token(symbol_or_address: str) -> str:
    """
    Resolve a token symbol or address to a mint address.

    Args:
        symbol_or_address: Token symbol (e.g., "USDC") or mint address

    Returns:
        Mint address string

    Raises:
        ValueError: If token cannot be resolved
    """
    normalized = symbol_or_address.strip().upper()

    # Check well-known tokens first (fast path)
    if normalized in WELL_KNOWN_TOKENS:
        return WELL_KNOWN_TOKENS[normalized]

    # Already a valid address?
    if is_valid_solana_address(symbol_or_address):
        return symbol_or_address

    # Search via API
    token = _search_token(normalized)
    if token and token.get("address"):
        return token["address"]

    raise ValueError(f"Unknown token: {symbol_or_address}. Provide a valid symbol or mint address.")


def get_token_decimals(symbol_or_address: str) -> int:
    """
    Get the decimals for a token.

    Args:
        symbol_or_address: Token symbol or mint address

    Returns:
        Number of decimals
    """
    normalized = symbol_or_address.strip().upper()

    # Check well-known decimals first
    if normalized in WELL_KNOWN_DECIMALS:
        return WELL_KNOWN_DECIMALS[normalized]

    # Try API lookup by symbol
    token = _search_token(normalized)
    if token and "decimals" in token:
        return token["decimals"]

    # If it's an address, try metadata lookup
    if is_valid_solana_address(symbol_or_address):
        metadata = _get_token_metadata(symbol_or_address)
        if metadata and "decimals" in metadata:
            return metadata["decimals"]

    return DEFAULT_DECIMALS


def amount_to_lamports(amount: float, symbol_or_address: str) -> int:
    """
    Convert a human-readable amount to lamports/smallest units.

    Args:
        amount: Human-readable amount (e.g., 1.5 SOL)
        symbol_or_address: Token symbol or mint address

    Returns:
        Amount in smallest units (lamports)
    """
    decimals = get_token_decimals(symbol_or_address)
    return int(amount * (10 ** decimals))


def lamports_to_amount(lamports: int, symbol_or_address: str) -> float:
    """
    Convert lamports to human-readable amount.

    Args:
        lamports: Amount in smallest units
        symbol_or_address: Token symbol or mint address

    Returns:
        Human-readable amount
    """
    decimals = get_token_decimals(symbol_or_address)
    return lamports / (10 ** decimals)


def get_token_symbol(mint_address: str) -> Optional[str]:
    """
    Get the symbol for a mint address.

    Args:
        mint_address: Token mint address

    Returns:
        Symbol if found, None otherwise
    """
    # Check well-known tokens first
    for symbol, address in WELL_KNOWN_TOKENS.items():
        if address == mint_address:
            return symbol

    # Try API lookup
    metadata = _get_token_metadata(mint_address)
    if metadata and metadata.get("symbol"):
        return metadata["symbol"]

    return None
