#!/usr/bin/env python3
"""
Token Data MCP Server
Provides token data, trending tokens, holder info using Birdeye API.
"""
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional, List
import httpx
from fastmcp import FastMCP
from dotenv import load_dotenv

# Load from project root
_root = Path(__file__).resolve().parent
while not (_root / '.env').exists() and _root != _root.parent:
    _root = _root.parent
load_dotenv(_root / '.env')

# Configuration
CONFIG = {
    'api_key': os.getenv('BIRDEYE_API_KEY'),
    'api_url': 'https://public-api.birdeye.so',
    'timeout': int(os.getenv('TIMEOUT', '30')),
    'debug': os.getenv('DEBUG', 'false').lower() == 'true'
}

HELIUS_API_KEY = os.getenv('HELIUS_API_KEY', '')
HELIUS_RPC_URL = f"https://mainnet.helius-rpc.com/?api-key={HELIUS_API_KEY}" if HELIUS_API_KEY else ""

if not CONFIG['api_key']:
    raise ValueError("BIRDEYE_API_KEY is required. Set it in .env file")

# MCP Server Setup
mcp = FastMCP(name="token-data")


@mcp.tool()
async def get_token_overview(
    address: str,
    chain: str = "solana"
) -> Dict[str, Any]:
    """
    Get detailed overview and stats for a token.

    Args:
        address: Token mint address (e.g., 'So11111111111111111111111111111111111111112' for SOL)
        chain: Blockchain network (default: solana)

    Returns:
        Token overview including price, volume, market cap, etc.
    """
    params = {"address": address}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{CONFIG['api_url']}/defi/token_overview",
                headers={
                    "X-API-KEY": CONFIG['api_key'],
                    "accept": "application/json",
                    "x-chain": chain
                },
                params=params,
                timeout=CONFIG['timeout']
            )

            if response.status_code == 200:
                data = response.json()
                return {
                    "status": "success",
                    "token": address,
                    "data": data.get("data", data)
                }
            else:
                return {
                    "status": "error",
                    "token": address,
                    "error": f"API error (status: {response.status_code})"
                }
    except httpx.TimeoutException:
        return {"status": "error", "token": address, "error": "Request timed out"}
    except Exception as e:
        return {"status": "error", "token": address, "error": str(e)}


@mcp.tool()
async def get_trending_tokens(
    sort_by: str = "rank",
    sort_type: str = "asc",
    offset: int = 0,
    limit: int = 20
) -> Dict[str, Any]:
    """
    Get a list of trending tokens on Solana.

    Args:
        sort_by: Sort field (rank, volume24hUSD, etc.)
        sort_type: Sort order ('asc' or 'desc')
        offset: Pagination offset
        limit: Number of results (max 50)

    Returns:
        List of trending tokens with their stats
    """
    params = {
        "sort_by": sort_by,
        "sort_type": sort_type,
        "offset": offset,
        "limit": min(limit, 50)
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{CONFIG['api_url']}/defi/token_trending",
                headers={
                    "X-API-KEY": CONFIG['api_key'],
                    "accept": "application/json",
                    "x-chain": "solana"
                },
                params=params,
                timeout=CONFIG['timeout']
            )

            if response.status_code == 200:
                data = response.json()
                tokens = data.get("data", {}).get("tokens", [])
                return {
                    "status": "success",
                    "tokens": tokens,
                    "count": len(tokens)
                }
            else:
                return {
                    "status": "error",
                    "error": f"API error (status: {response.status_code})"
                }
    except httpx.TimeoutException:
        return {"status": "error", "error": "Request timed out"}
    except Exception as e:
        return {"status": "error", "error": str(e)}


@mcp.tool()
async def get_token_holders(
    address: str,
    offset: int = 0,
    limit: int = 20
) -> Dict[str, Any]:
    """
    Get top holders of a token.

    Args:
        address: Token mint address
        offset: Pagination offset
        limit: Number of results (max 100)

    Returns:
        List of top token holders with their balances
    """
    params = {
        "address": address,
        "offset": offset,
        "limit": min(limit, 100)
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{CONFIG['api_url']}/defi/v3/token/holder",
                headers={
                    "X-API-KEY": CONFIG['api_key'],
                    "accept": "application/json",
                    "x-chain": "solana"
                },
                params=params,
                timeout=CONFIG['timeout']
            )

            if response.status_code == 200:
                data = response.json()
                holders = data.get("data", {}).get("items", [])
                return {
                    "status": "success",
                    "token": address,
                    "holders": holders,
                    "count": len(holders)
                }
            else:
                return {
                    "status": "error",
                    "token": address,
                    "error": f"API error (status: {response.status_code})"
                }
    except httpx.TimeoutException:
        return {"status": "error", "token": address, "error": "Request timed out"}
    except Exception as e:
        return {"status": "error", "token": address, "error": str(e)}


@mcp.tool()
async def get_token_creation_info(address: str) -> Dict[str, Any]:
    """
    Get creation transaction info for a token.

    Args:
        address: Token mint address

    Returns:
        Token creation details including creator, timestamp, transaction
    """
    params = {"address": address}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{CONFIG['api_url']}/defi/token_creation_info",
                headers={
                    "X-API-KEY": CONFIG['api_key'],
                    "accept": "application/json",
                    "x-chain": "solana"
                },
                params=params,
                timeout=CONFIG['timeout']
            )

            if response.status_code == 200:
                data = response.json()
                return {
                    "status": "success",
                    "token": address,
                    "creation_info": data.get("data", data)
                }
            else:
                return {
                    "status": "error",
                    "token": address,
                    "error": f"API error (status: {response.status_code})"
                }
    except httpx.TimeoutException:
        return {"status": "error", "token": address, "error": "Request timed out"}
    except Exception as e:
        return {"status": "error", "token": address, "error": str(e)}


@mcp.tool()
async def search_tokens(
    keyword: str,
    chain: str = "solana",
    offset: int = 0,
    limit: int = 20
) -> Dict[str, Any]:
    """
    Search for tokens by name, symbol, or address.

    Args:
        keyword: Search term (token name, symbol, or address)
        chain: Blockchain network (default: solana)
        offset: Pagination offset
        limit: Number of results (max 50)

    Returns:
        List of matching tokens
    """
    params = {
        "keyword": keyword,
        "offset": offset,
        "limit": min(limit, 50)
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{CONFIG['api_url']}/defi/v3/search",
                headers={
                    "X-API-KEY": CONFIG['api_key'],
                    "accept": "application/json",
                    "x-chain": chain
                },
                params=params,
                timeout=CONFIG['timeout']
            )

            if response.status_code == 200:
                data = response.json()
                results = data.get("data", {})
                return {
                    "status": "success",
                    "keyword": keyword,
                    "results": results
                }
            else:
                return {
                    "status": "error",
                    "keyword": keyword,
                    "error": f"API error (status: {response.status_code})"
                }
    except httpx.TimeoutException:
        return {"status": "error", "keyword": keyword, "error": "Request timed out"}
    except Exception as e:
        return {"status": "error", "keyword": keyword, "error": str(e)}


@mcp.tool()
async def get_price_history(
    address: str,
    interval: str = "1H",
    time_from: Optional[int] = None,
    time_to: Optional[int] = None,
    chain: str = "solana"
) -> Dict[str, Any]:
    """
    Get historical price data for a token.

    Args:
        address: Token mint address (e.g., 'So11111111111111111111111111111111111111112' for SOL)
        interval: Time interval - 1m, 5m, 15m, 30m, 1H, 2H, 4H, 6H, 8H, 12H, 1D, 3D, 1W, 1M (default: 1H)
        time_from: Unix timestamp start in seconds (default: 24 hours ago)
        time_to: Unix timestamp end in seconds (default: now)
        chain: Blockchain network (default: solana)

    Returns:
        Historical price data points with timestamps and values
    """
    now = int(time.time())
    if time_to is None:
        time_to = now
    if time_from is None:
        time_from = now - 86400  # 24 hours ago

    params = {
        "address": address,
        "address_type": "token",
        "type": interval,
        "time_from": time_from,
        "time_to": time_to
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{CONFIG['api_url']}/defi/history_price",
                headers={
                    "X-API-KEY": CONFIG['api_key'],
                    "accept": "application/json",
                    "x-chain": chain
                },
                params=params,
                timeout=CONFIG['timeout']
            )

            if response.status_code == 200:
                data = response.json()
                items = data.get("data", {}).get("items", [])
                return {
                    "status": "success",
                    "token": address,
                    "interval": interval,
                    "time_from": time_from,
                    "time_to": time_to,
                    "prices": items,
                    "count": len(items)
                }
            else:
                return {
                    "status": "error",
                    "token": address,
                    "error": f"API error (status: {response.status_code})"
                }
    except httpx.TimeoutException:
        return {"status": "error", "token": address, "error": "Request timed out"}
    except Exception as e:
        return {"status": "error", "token": address, "error": str(e)}


@mcp.tool()
async def get_price_at_date(
    address: str,
    date: str
) -> Dict[str, Any]:
    """
    Get token price at a specific date.

    Args:
        address: Token mint address (e.g., 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' for BONK)
        date: Date in DD-MM-YYYY format (e.g., "04-09-2025" for September 4th 2025)

    Returns:
        Price data for that date
    """
    try:
        # Parse DD-MM-YYYY format
        day, month, year = date.split("-")
        parsed_date = datetime(int(year), int(month), int(day), tzinfo=timezone.utc)

        # Start and end of day in UTC
        time_from = int(parsed_date.timestamp())
        time_to = int(parsed_date.timestamp()) + 86399  # +23:59:59

    except Exception as e:
        return {
            "status": "error",
            "error": f"Invalid date format. Use DD-MM-YYYY (e.g., '04-09-2025'): {str(e)}"
        }

    params = {
        "address": address,
        "address_type": "token",
        "type": "1D",
        "time_from": time_from,
        "time_to": time_to
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{CONFIG['api_url']}/defi/history_price",
                headers={
                    "X-API-KEY": CONFIG['api_key'],
                    "accept": "application/json",
                    "x-chain": "solana"
                },
                params=params,
                timeout=CONFIG['timeout']
            )

            if response.status_code == 200:
                data = response.json()
                items = data.get("data", {}).get("items", [])

                if not items:
                    return {
                        "status": "success",
                        "token": address,
                        "date": date,
                        "price": None,
                        "message": "No price data available for this date"
                    }

                candle = items[0]
                return {
                    "status": "success",
                    "token": address,
                    "date": date,
                    "price": candle.get("value"),
                    "unix_time": candle.get("unixTime")
                }
            else:
                return {
                    "status": "error",
                    "token": address,
                    "error": f"API error (status: {response.status_code})"
                }
    except httpx.TimeoutException:
        return {"status": "error", "token": address, "error": "Request timed out"}
    except Exception as e:
        return {"status": "error", "token": address, "error": str(e)}


@mcp.tool()
async def get_wallet_pnl(
    wallet: str,
    token_addresses: Optional[List[str]] = None,
    sort_by: str = "last_trade",
    sort_type: str = "desc",
    limit: int = 10,
    offset: int = 0
) -> Dict[str, Any]:
    """
    Get detailed PnL (Profit and Loss) breakdown for a wallet.

    Args:
        wallet: Wallet address to analyze
        token_addresses: Optional list of token addresses to filter (max 100)
        sort_by: Sort field - 'value' (by current value) or 'last_trade' (by recent activity)
        sort_type: Sort direction - 'asc' (ascending) or 'desc' (descending)
        limit: Number of results per page (1-100, default: 10)
        offset: Pagination offset (0-10000, default: 0)

    Returns:
        Detailed PnL data including:
        - Per-token: realized/unrealized profit, buy/sell counts, avg costs
        - Summary: total PnL, unique tokens traded, overall performance
    """
    # Build request body
    body = {
        "wallet": wallet,
        "sort_by": sort_by,
        "sort_type": sort_type,
        "limit": min(max(limit, 1), 100),
        "offset": min(max(offset, 0), 10000)
    }

    # Add optional token filter
    if token_addresses:
        body["token_addresses"] = token_addresses[:100]  # Max 100 tokens

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{CONFIG['api_url']}/wallet/v2/pnl/details",
                headers={
                    "X-API-KEY": CONFIG['api_key'],
                    "accept": "application/json",
                    "content-type": "application/json",
                    "x-chain": "solana"
                },
                json=body,
                timeout=CONFIG['timeout']
            )

            if response.status_code == 200:
                data = response.json()
                result = data.get("data", {})
                return {
                    "status": "success",
                    "wallet": wallet,
                    "tokens": result.get("tokens", []),
                    "summary": result.get("summary", {}),
                    "meta": result.get("meta", {})
                }
            else:
                return {
                    "status": "error",
                    "wallet": wallet,
                    "error": f"API error (status: {response.status_code})"
                }
    except httpx.TimeoutException:
        return {"status": "error", "wallet": wallet, "error": "Request timed out"}
    except Exception as e:
        return {"status": "error", "wallet": wallet, "error": str(e)}


# ============================================================================
# TOKEN SNIPER TOOLS
# ============================================================================

@mcp.tool()
async def get_new_listings(
    limit: int = 20,
    include_memecoins: bool = True
) -> Dict[str, Any]:
    """
    Get recently launched tokens on Solana.

    Args:
        limit: Number of tokens to fetch (1-20, default: 20)
        include_memecoins: Include pump.fun and other meme platform tokens (default: True)

    Returns:
        List of newly listed tokens with address, symbol, name, liquidity, listing time
    """
    params = {
        "limit": min(max(limit, 1), 20),
        "meme_platform_enabled": str(include_memecoins).lower()
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{CONFIG['api_url']}/defi/v2/tokens/new_listing",
                headers={
                    "X-API-KEY": CONFIG['api_key'],
                    "accept": "application/json",
                    "x-chain": "solana"
                },
                params=params,
                timeout=CONFIG['timeout']
            )

            if response.status_code == 200:
                data = response.json()
                items = data.get("data", {}).get("items", [])
                return {
                    "status": "success",
                    "tokens": items,
                    "count": len(items)
                }
            else:
                return {
                    "status": "error",
                    "error": f"API error (status: {response.status_code})"
                }
    except httpx.TimeoutException:
        return {"status": "error", "error": "Request timed out"}
    except Exception as e:
        return {"status": "error", "error": str(e)}


# Known legitimate tokens — these should NEVER be flagged as unsafe.
# Active mint/freeze authority is by-design for regulated stablecoins and LSTs.
KNOWN_SAFE_TOKENS = {
    # Stablecoins
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": {"symbol": "USDC", "issuer": "Circle", "type": "stablecoin"},
    "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": {"symbol": "USDT", "issuer": "Tether", "type": "stablecoin"},
    "2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH": {"symbol": "USDG", "issuer": "Paxos", "type": "stablecoin"},
    "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo": {"symbol": "PYUSD", "issuer": "PayPal/Paxos", "type": "stablecoin"},
    "USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA": {"symbol": "USDS", "issuer": "Sky (Maker)", "type": "stablecoin"},
    # LSTs
    "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So": {"symbol": "mSOL", "issuer": "Marinade", "type": "lst"},
    "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn": {"symbol": "jitoSOL", "issuer": "Jito", "type": "lst"},
    "bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1": {"symbol": "bSOL", "issuer": "Blaze", "type": "lst"},
    # Major tokens
    "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263": {"symbol": "BONK", "issuer": "community", "type": "memecoin"},
    "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN": {"symbol": "JUP", "issuer": "Jupiter", "type": "governance"},
    "27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4": {"symbol": "JLP", "issuer": "Jupiter", "type": "lp_token"},
}


@mcp.tool()
async def get_token_security(
    address: str
) -> Dict[str, Any]:
    """
    Get security facts for a token. Returns raw data — NOT a verdict.

    For known tokens (USDC, USDT, USDG, PYUSD, mSOL, jitoSOL, JUP, BONK, etc.),
    returns immediately with verified info. Active mint authority is NORMAL for
    stablecoins and LSTs — it's how the issuer mints/burns supply.

    For unknown tokens, checks mint authority and top holder concentration via Birdeye.

    Args:
        address: Token mint address

    Returns:
        Security facts: mint_authority_status, top_holder_pct, risk_level, notes
    """
    # ── Fast path: known safe tokens ──
    known = KNOWN_SAFE_TOKENS.get(address)
    if known:
        return {
            "status": "success",
            "token": address,
            "symbol": known["symbol"],
            "known_token": True,
            "issuer": known["issuer"],
            "token_type": known["type"],
            "risk_level": "low",
            "mint_authority": "active (by design — issuer manages supply)",
            "notes": f"{known['symbol']} is a well-known {known['type']} issued by {known['issuer']}. "
                     f"Active mint authority is expected and normal for {known['type']}s.",
        }

    # ── Unknown token: check via Helius DAS (free) + Jupiter sell quote (free) ──
    result = {
        "status": "success",
        "token": address,
        "known_token": False,
        "risk_level": "unknown",
        "symbol": None,
        "name": None,
        "mint_authority": None,
        "freeze_authority": None,
        "supply": None,
        "can_sell": None,
        "notes": "",
    }

    flags = []
    _das_decimals = 6  # Default; updated from DAS if available

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            # ── Check 1: Helius DAS getAsset — mint authority, freeze authority, supply, metadata ──
            if HELIUS_RPC_URL:
                try:
                    das_resp = await client.post(HELIUS_RPC_URL, json={
                        "jsonrpc": "2.0", "id": 1,
                        "method": "getAsset",
                        "params": {"id": address},
                    })
                    if das_resp.status_code == 200:
                        asset = das_resp.json().get("result", {})

                        # Metadata
                        metadata = asset.get("content", {}).get("metadata", {})
                        result["symbol"] = metadata.get("symbol") or None
                        result["name"] = metadata.get("name") or None

                        # Token info — mint authority, freeze authority, supply
                        token_info = asset.get("token_info", {})
                        mint_auth = token_info.get("mint_authority")
                        freeze_auth = token_info.get("freeze_authority")
                        supply = token_info.get("supply")
                        decimals = token_info.get("decimals", 0)
                        _das_decimals = decimals or 6

                        if mint_auth:
                            result["mint_authority"] = "active"
                            flags.append("mint authority is active — issuer can mint more tokens")
                        else:
                            result["mint_authority"] = "revoked"

                        if freeze_auth:
                            result["freeze_authority"] = "active"
                            flags.append("freeze authority is active — issuer can freeze token accounts")
                        else:
                            result["freeze_authority"] = "revoked"

                        if supply is not None and decimals:
                            human_supply = supply / (10 ** decimals)
                            result["supply"] = human_supply

                        # Check if token is mutable (metadata can be changed)
                        if asset.get("mutable"):
                            flags.append("token metadata is mutable — name/symbol can be changed")

                except Exception as e:
                    logger.warning(f"DAS getAsset failed for {address}: {e}")

            # ── Check 2: Jupiter sell quote — can this token actually be sold? ──
            SOL_MINT = "So11111111111111111111111111111111111111112"
            try:
                # Use 1 token as test amount
                test_amount = 10 ** _das_decimals  # 1 whole token

                quote_resp = await client.get(
                    "https://lite-api.jup.ag/swap/v1/quote",
                    params={
                        "inputMint": address,
                        "outputMint": SOL_MINT,
                        "amount": str(test_amount),
                        "slippageBps": "500",
                    },
                    timeout=5.0,
                )

                if quote_resp.status_code == 200:
                    quote = quote_resp.json()
                    out_amount = int(quote.get("outAmount", 0))
                    result["can_sell"] = out_amount > 0
                    if out_amount == 0:
                        flags.append("jupiter returned 0 output — token may be illiquid or a honeypot")
                    # Check price impact
                    price_impact = quote.get("priceImpactPct")
                    if price_impact:
                        try:
                            impact = abs(float(price_impact))
                            if impact > 10:
                                flags.append(f"high price impact ({impact:.1f}%) — very low liquidity")
                            elif impact > 5:
                                flags.append(f"moderate price impact ({impact:.1f}%) — low liquidity")
                        except (ValueError, TypeError):
                            pass
                else:
                    result["can_sell"] = False
                    flags.append("no jupiter sell route found — token may be unsellable")

            except Exception as e:
                logger.debug(f"Jupiter sell quote failed for {address}: {e}")
                # Not critical — just means we can't verify sellability

            # ── Determine risk level ──
            has_mint_data = result["mint_authority"] is not None
            has_sell_data = result["can_sell"] is not None

            if not has_mint_data and not has_sell_data:
                result["risk_level"] = "unknown"
                result["notes"] = "Could not verify — no data available. Proceed with caution."
                flags.append("no security data available")
            elif result["can_sell"] is False:
                result["risk_level"] = "high"
                result["notes"] = " | ".join(flags)
            elif len(flags) >= 3:
                result["risk_level"] = "high"
                result["notes"] = " | ".join(flags)
            elif len(flags) >= 1:
                result["risk_level"] = "medium"
                result["notes"] = " | ".join(flags)
            else:
                result["risk_level"] = "low"
                result["notes"] = "Mint authority revoked, freeze authority revoked, token is sellable on Jupiter."

            result["flags"] = flags
            return result

    except httpx.TimeoutException:
        return {"status": "error", "token": address, "error": "Request timed out"}
    except Exception as e:
        return {"status": "error", "token": address, "error": str(e)}


@mcp.tool()
async def check_honeypot(
    address: str,
    test_amount_usd: float = 10.0
) -> Dict[str, Any]:
    """
    Test if a token is a honeypot by simulating a sell via Jupiter.

    Args:
        address: Token mint address to test
        test_amount_usd: USD amount to simulate selling (default: $10)

    Returns:
        Honeypot test result - is_honeypot, can_sell, quote details
    """
    # SOL mint address for output
    SOL_MINT = "So11111111111111111111111111111111111111112"
    JUPITER_API = "https://quote-api.jup.ag/v6"

    try:
        async with httpx.AsyncClient() as client:
            # First get token info to know decimals and approximate value
            token_response = await client.get(
                f"{CONFIG['api_url']}/defi/token_overview",
                headers={
                    "X-API-KEY": CONFIG['api_key'],
                    "accept": "application/json",
                    "x-chain": "solana"
                },
                params={"address": address},
                timeout=CONFIG['timeout']
            )

            if token_response.status_code != 200:
                return {
                    "status": "error",
                    "token": address,
                    "error": "Could not fetch token info"
                }

            token_data = token_response.json().get("data", {})
            decimals = token_data.get("decimals", 9)
            price = token_data.get("price", 0)

            if price <= 0:
                return {
                    "status": "success",
                    "token": address,
                    "is_honeypot": True,
                    "reason": "Token has no price",
                    "can_sell": False
                }

            # Calculate amount of tokens for test_amount_usd
            token_amount = int((test_amount_usd / price) * (10 ** decimals))

            # Get Jupiter quote for selling token -> SOL
            quote_response = await client.get(
                f"{JUPITER_API}/quote",
                params={
                    "inputMint": address,
                    "outputMint": SOL_MINT,
                    "amount": str(token_amount),
                    "slippageBps": "500"  # 5% slippage
                },
                timeout=15
            )

            if quote_response.status_code == 200:
                quote_data = quote_response.json()
                out_amount = int(quote_data.get("outAmount", 0))
                return {
                    "status": "success",
                    "token": address,
                    "is_honeypot": False,
                    "can_sell": out_amount > 0,
                    "test_amount_usd": test_amount_usd,
                    "quote": {
                        "in_amount": token_amount,
                        "out_amount": out_amount,
                        "out_amount_sol": out_amount / 1e9,
                        "price_impact": quote_data.get("priceImpactPct", "unknown")
                    }
                }
            else:
                # No route found or error - likely honeypot
                return {
                    "status": "success",
                    "token": address,
                    "is_honeypot": True,
                    "can_sell": False,
                    "reason": f"Jupiter returned no route (status: {quote_response.status_code})"
                }

    except httpx.TimeoutException:
        return {"status": "error", "token": address, "error": "Request timed out"}
    except Exception as e:
        return {"status": "error", "token": address, "error": str(e)}


@mcp.tool()
async def get_token_momentum(
    address: str
) -> Dict[str, Any]:
    """
    Calculate momentum score for a token (for sniper ranking).

    Scoring:
    - Volume explosion (1h vol > 3x hourly avg): +3 points
    - Holder growth: +2 points (based on recent growth)
    - Price momentum (50-500% gain): +2 points
    - Returns total score 0-8

    Args:
        address: Token mint address

    Returns:
        Momentum analysis with score (0-8) and breakdown
    """
    result = {
        "status": "success",
        "token": address,
        "score": 0,
        "max_score": 8,
        "breakdown": {},
        "metrics": {}
    }

    try:
        async with httpx.AsyncClient() as client:
            # Get token overview for metrics
            response = await client.get(
                f"{CONFIG['api_url']}/defi/token_overview",
                headers={
                    "X-API-KEY": CONFIG['api_key'],
                    "accept": "application/json",
                    "x-chain": "solana"
                },
                params={"address": address},
                timeout=CONFIG['timeout']
            )

            if response.status_code != 200:
                return {
                    "status": "error",
                    "token": address,
                    "error": f"API error (status: {response.status_code})"
                }

            data = response.json().get("data", {})

            # Extract metrics
            v_1h = data.get("v1hUSD", 0) or 0
            v_24h = data.get("v24hUSD", 0) or 0
            price_change_1h = data.get("priceChange1hPercent", 0) or 0
            holder_count = data.get("holder", 0) or 0
            mc = data.get("mc", 0) or 0
            liquidity = data.get("liquidity", 0) or 0

            result["metrics"] = {
                "volume_1h": v_1h,
                "volume_24h": v_24h,
                "price_change_1h_pct": price_change_1h,
                "holder_count": holder_count,
                "market_cap": mc,
                "liquidity": liquidity
            }

            # Score 1: Volume explosion (+300% in 1hr compared to avg hourly)
            # If v_1h > (v_24h / 24) * 3, that's 3x the average hourly volume
            hourly_avg = v_24h / 24 if v_24h > 0 else 0
            if hourly_avg > 0 and v_1h > hourly_avg * 3:
                result["score"] += 3
                result["breakdown"]["volume_explosion"] = {
                    "points": 3,
                    "reason": f"1h vol ${v_1h:,.0f} is {v_1h/hourly_avg:.1f}x hourly avg"
                }
            else:
                result["breakdown"]["volume_explosion"] = {"points": 0, "reason": "Volume not exploding"}

            # Score 2: Price momentum (50-500% = sweet spot, not too parabolic)
            if 50 < price_change_1h < 500:
                result["score"] += 2
                result["breakdown"]["price_momentum"] = {
                    "points": 2,
                    "reason": f"Price up {price_change_1h:.1f}% in 1h (healthy range)"
                }
            elif price_change_1h >= 500:
                result["score"] += 1
                result["breakdown"]["price_momentum"] = {
                    "points": 1,
                    "reason": f"Price up {price_change_1h:.1f}% (may be overextended)"
                }
            else:
                result["breakdown"]["price_momentum"] = {"points": 0, "reason": f"Price change {price_change_1h:.1f}%"}

            # Score 3: Holder count (more holders = more traction)
            if holder_count > 500:
                result["score"] += 2
                result["breakdown"]["holder_traction"] = {
                    "points": 2,
                    "reason": f"{holder_count:,} holders (strong traction)"
                }
            elif holder_count > 100:
                result["score"] += 1
                result["breakdown"]["holder_traction"] = {
                    "points": 1,
                    "reason": f"{holder_count:,} holders (growing)"
                }
            else:
                result["breakdown"]["holder_traction"] = {"points": 0, "reason": f"Only {holder_count} holders"}

            # Score 4: Market cap sweet spot ($10k-$500k = early, $500k-$2M = mid)
            if 10000 < mc < 500000:
                result["score"] += 1
                result["breakdown"]["market_cap"] = {
                    "points": 1,
                    "reason": f"MC ${mc:,.0f} (early stage, high upside)"
                }
            elif 500000 <= mc < 2000000:
                result["score"] += 0.5
                result["breakdown"]["market_cap"] = {
                    "points": 0.5,
                    "reason": f"MC ${mc:,.0f} (mid stage)"
                }
            else:
                result["breakdown"]["market_cap"] = {"points": 0, "reason": f"MC ${mc:,.0f}"}

            result["score"] = min(result["score"], 8)  # Cap at max
            result["rating"] = "🔥" if result["score"] >= 6 else "⭐" if result["score"] >= 4 else "👀"

            return result

    except httpx.TimeoutException:
        return {"status": "error", "token": address, "error": "Request timed out"}
    except Exception as e:
        return {"status": "error", "token": address, "error": str(e)}


def main():
    """Run the MCP server"""
    if CONFIG['debug']:
        print(f"Starting {mcp.name} in debug mode...")
        print(f"API URL: {CONFIG['api_url']}")

    mcp.run()


if __name__ == "__main__":
    main()
