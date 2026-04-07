#!/usr/bin/env python3
"""
Prediction Markets MCP Server
Provides Polymarket data via Dome API for the agent.
"""
import os
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from fastmcp import FastMCP
from dotenv import load_dotenv
from dome_api_sdk import DomeClient
from dome_api_sdk.types import (
    GetMarketsParams,
    GetOrdersParams,
    GetActivityParams,
    GetWalletPnLParams,
    GetMarketPriceParams,
)

# Load from project root
_root = Path(__file__).resolve().parent
while not (_root / '.env').exists() and _root != _root.parent:
    _root = _root.parent
load_dotenv(_root / '.env')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
CONFIG = {
    'api_key': os.getenv('DOME_API_KEY'),
    'timeout': int(os.getenv('DOME_TIMEOUT', '30')),
    'debug': os.getenv('DEBUG', 'false').lower() == 'true'
}

if not CONFIG['api_key']:
    raise ValueError("DOME_API_KEY is required. Set it in .env file")

# Initialize Dome client (synchronous SDK)
dome = DomeClient({'api_key': CONFIG['api_key']})

mcp = FastMCP(name="prediction-markets")


def market_to_dict(m) -> Dict[str, Any]:
    """Convert Market object to dict."""
    return {
        "title": getattr(m, 'title', None),
        "slug": getattr(m, 'market_slug', None),
        "status": getattr(m, 'status', 'unknown'),
        "volume_total": getattr(m, 'volume_total', 0),
        "volume_1_week": getattr(m, 'volume_1_week', 0),
        "tags": getattr(m, 'tags', []),
        "end_time": getattr(m, 'end_time', None),
        "game_start_time": getattr(m, 'game_start_time', None),
        "side_a": {
            "id": m.side_a.id if hasattr(m, 'side_a') and m.side_a else None,
            "label": m.side_a.label if hasattr(m, 'side_a') and m.side_a else None,
        } if hasattr(m, 'side_a') else None,
        "side_b": {
            "id": m.side_b.id if hasattr(m, 'side_b') and m.side_b else None,
            "label": m.side_b.label if hasattr(m, 'side_b') and m.side_b else None,
        } if hasattr(m, 'side_b') else None,
        "winning_side": getattr(m, 'winning_side', None),
    }


@mcp.tool()
def search_markets(
    query: Optional[str] = None,
    status: str = "open",
    tags: Optional[str] = None,
    limit: int = 10
) -> Dict[str, Any]:
    """
    Search and filter Polymarket prediction markets.

    Args:
        query: Market slug or exact search term (e.g., "khamenei-out-as-supreme-leader-of-iran-by-january-31")
               For best results, use the full market slug from Polymarket URL.
        status: Market status filter - "open", "closed", or "resolved"
        tags: Filter by tag (e.g., "Politics", "Crypto", "Sports", "NBA")
        limit: Max results (1-50)

    Returns:
        List of markets with titles, odds, volume
    """
    try:
        markets = []

        if query:
            # Convert query to slug format and try exact match
            slug_query = query.lower().replace(' ', '-')
            slug_result = dome.polymarket.markets.get_markets({
                'market_slug': slug_query,
                'limit': limit
            })
            if slug_result and slug_result.markets:
                markets.extend(slug_result.markets)

        # If no query or no results from slug, fetch by status/tags
        if not markets:
            params: Dict[str, Any] = {'limit': min(limit * 2, 100)}
            if status:
                params['status'] = status
            if tags:
                params['tags'] = [tags]

            result = dome.polymarket.markets.get_markets(params)  # type: ignore
            if result and result.markets:
                # If query provided, filter client-side
                if query:
                    query_lower = query.lower()
                    for m in result.markets:
                        title_lower = (m.title or '').lower()
                        slug_lower = (m.market_slug or '').lower()
                        if query_lower in title_lower or query_lower in slug_lower:
                            markets.append(m)
                else:
                    markets = result.markets

        # Filter by status if specified
        if status:
            markets = [m for m in markets if getattr(m, 'status', '').lower() == status.lower()]

        if not markets:
            return {
                "status": "success",
                "markets": [],
                "count": 0,
                "message": f"No markets found for '{query}'. Try using the full market slug from the Polymarket URL." if query else "No markets found"
            }

        # Format markets for display
        formatted_markets = []
        for m in markets[:limit]:
            formatted_markets.append(market_to_dict(m))

        return {
            "status": "success",
            "markets": formatted_markets,
            "count": len(formatted_markets),
            "query": query,
        }

    except Exception as e:
        logger.error(f"Error searching markets: {e}")
        return {"status": "error", "error": str(e)}


@mcp.tool()
def get_market_details(market_slug: str) -> Dict[str, Any]:
    """
    Get detailed information about a specific market.

    Args:
        market_slug: Market identifier from Polymarket (e.g., "will-trump-win-2024")

    Returns:
        Full market details including outcomes, odds, volume, end date
    """
    try:
        params: GetMarketsParams = {
            'market_slug': market_slug,
            'limit': 1
        }
        result = dome.polymarket.markets.get_markets(params)

        if not result or not result.markets:
            return {
                "status": "error",
                "error": f"Market '{market_slug}' not found"
            }

        market = result.markets[0]

        return {
            "status": "success",
            "market": {
                **market_to_dict(market),
                "condition_id": getattr(market, 'condition_id', None),
                "resolution_source": getattr(market, 'resolution_source', None),
                "image": getattr(market, 'image', None),
                "start_time": getattr(market, 'start_time', None),
                "close_time": getattr(market, 'close_time', None),
                "completed_time": getattr(market, 'completed_time', None),
            }
        }

    except Exception as e:
        logger.error(f"Error getting market details: {e}")
        return {"status": "error", "error": str(e)}


@mcp.tool()
def get_market_price(
    token_id: str
) -> Dict[str, Any]:
    """
    Get current price for a market outcome token.

    Args:
        token_id: Outcome token ID from Polymarket (side_a.id or side_b.id from market details)

    Returns:
        Current price as a decimal (0.0 to 1.0) and as percentage
    """
    try:
        # Get current price
        price_params: GetMarketPriceParams = {'token_id': token_id}
        price_result = dome.polymarket.markets.get_market_price(price_params)

        current_price = None
        at_time = None
        if price_result:
            current_price = getattr(price_result, 'price', None)
            at_time = getattr(price_result, 'at_time', None)

        return {
            "status": "success",
            "token_id": token_id,
            "current_price": current_price,
            "current_price_pct": f"{float(current_price) * 100:.1f}%" if current_price else None,
            "at_time": at_time,
        }

    except Exception as e:
        logger.error(f"Error getting market price: {e}")
        return {"status": "error", "error": str(e)}


@mcp.tool()
def get_recent_trades(
    market_slug: Optional[str] = None,
    wallet_address: Optional[str] = None,
    limit: int = 20
) -> Dict[str, Any]:
    """
    Get recent trading activity (order history).

    Args:
        market_slug: Filter by specific market
        wallet_address: Filter by trader's Polygon wallet address
        limit: Max results (1-100)

    Returns:
        Recent trades with amounts, prices, timestamps
    """
    try:
        params: GetOrdersParams = {'limit': min(limit, 100)}

        if market_slug:
            params['market_slug'] = market_slug

        if wallet_address:
            params['user'] = wallet_address

        result = dome.polymarket.orders.get_orders(params)

        if not result or not result.orders:
            return {
                "status": "success",
                "trades": [],
                "count": 0,
                "message": "No trades found"
            }

        formatted_trades = []
        for t in result.orders[:limit]:
            formatted_trades.append({
                "market_slug": getattr(t, 'market_slug', None),
                "side": getattr(t, 'side', None),
                "outcome": getattr(t, 'outcome', None),
                "price": getattr(t, 'price', None),
                "size": getattr(t, 'size', None),
                "timestamp": getattr(t, 'timestamp', None),
                "user": (getattr(t, 'user', '') or '')[:10] + "..." if getattr(t, 'user', None) else None,
            })

        return {
            "status": "success",
            "trades": formatted_trades,
            "count": len(formatted_trades)
        }

    except Exception as e:
        logger.error(f"Error getting recent trades: {e}")
        return {"status": "error", "error": str(e)}


@mcp.tool()
def get_polymarket_pnl(
    wallet_address: str,
    days: int = 30
) -> Dict[str, Any]:
    """
    Get profit/loss history for a Polymarket wallet (Polygon/Ethereum).

    Note: This is for Polymarket prediction market wallets (0x...), NOT Solana wallets.
    For Solana wallet PnL, use get_wallet_pnl from the token-data server instead.

    Args:
        wallet_address: Ethereum/Polygon wallet address (0x...)
        days: Number of days to look back (1-365)

    Returns:
        Realized PnL, trade history summary
    """
    try:
        # Validate wallet address format
        if not wallet_address.startswith("0x") or len(wallet_address) != 42:
            return {
                "status": "error",
                "error": "Invalid wallet address. Must be a 42-character Ethereum address starting with 0x"
            }

        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=min(days, 365))

        params: GetWalletPnLParams = {
            'wallet_address': wallet_address,
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d'),
        }

        result = dome.polymarket.wallet.get_wallet_pnl(params)

        if not result:
            return {
                "status": "success",
                "wallet": wallet_address,
                "pnl": None,
                "message": "No PnL data found for this wallet"
            }

        return {
            "status": "success",
            "wallet": wallet_address,
            "period_days": days,
            "realized_pnl": getattr(result, 'realized_pnl', None),
            "unrealized_pnl": getattr(result, 'unrealized_pnl', None),
            "total_pnl": getattr(result, 'total_pnl', None),
            "num_trades": getattr(result, 'num_trades', None),
            "win_rate": getattr(result, 'win_rate', None),
        }

    except Exception as e:
        logger.error(f"Error getting wallet PnL: {e}")
        return {"status": "error", "error": str(e)}


@mcp.tool()
def get_market_activity(
    limit: int = 20
) -> Dict[str, Any]:
    """
    Get recent market activity events (MERGE, SPLIT, REDEEM operations).

    Args:
        limit: Max results (1-100)

    Returns:
        Recent activity events with types and amounts
    """
    try:
        params: GetActivityParams = {'limit': min(limit, 100)}
        result = dome.polymarket.activity.get_activity(params)

        if not result or not result.activity:
            return {
                "status": "success",
                "activity": [],
                "count": 0,
                "message": "No recent activity found"
            }

        formatted_activity = []
        for a in result.activity[:limit]:
            formatted_activity.append({
                "type": getattr(a, 'type', None),
                "market_slug": getattr(a, 'market_slug', None),
                "amount": getattr(a, 'amount', None),
                "timestamp": getattr(a, 'timestamp', None),
                "user": (getattr(a, 'user', '') or '')[:10] + "..." if getattr(a, 'user', None) else None,
            })

        return {
            "status": "success",
            "activity": formatted_activity,
            "count": len(formatted_activity)
        }

    except Exception as e:
        logger.error(f"Error getting market activity: {e}")
        return {"status": "error", "error": str(e)}


@mcp.tool()
def get_trending_markets(
    category: Optional[str] = None,
    limit: int = 5
) -> Dict[str, Any]:
    """
    Get trending/popular prediction markets sorted by volume.

    Args:
        category: Filter by category - "Politics", "Crypto", "Sports", "NBA", "NFL", etc.
        limit: Number of top markets to return (1-20)

    Returns:
        Top markets by trading volume
    """
    try:
        params: GetMarketsParams = {
            'status': 'open',
            'limit': 50,  # Get more to sort by volume
        }

        if category:
            params['tags'] = [category]

        result = dome.polymarket.markets.get_markets(params)

        if not result or not result.markets:
            return {
                "status": "success",
                "markets": [],
                "count": 0,
                "message": "No trending markets found"
            }

        markets = result.markets

        # Sort by volume
        markets_sorted = sorted(
            markets,
            key=lambda x: getattr(x, 'volume_total', 0) or 0,
            reverse=True
        )

        formatted_markets = []
        for m in markets_sorted[:min(limit, 20)]:
            volume = getattr(m, 'volume_total', 0) or 0

            # Build odds string from sides
            odds_parts = []
            if hasattr(m, 'side_a') and m.side_a:
                odds_parts.append(f"{m.side_a.label}")
            if hasattr(m, 'side_b') and m.side_b:
                odds_parts.append(f"{m.side_b.label}")
            odds_str = " vs ".join(odds_parts) if odds_parts else "N/A"

            formatted_markets.append({
                "title": getattr(m, 'title', 'Unknown'),
                "slug": getattr(m, 'market_slug', ''),
                "volume": volume,
                "volume_display": f"${volume:,.0f}",
                "outcomes": odds_str,
                "tags": getattr(m, 'tags', []),
            })

        return {
            "status": "success",
            "markets": formatted_markets,
            "count": len(formatted_markets),
            "category": category
        }

    except Exception as e:
        logger.error(f"Error getting trending markets: {e}")
        return {"status": "error", "error": str(e)}


def main():
    if CONFIG['debug']:
        logger.info(f"Starting {mcp.name} server...")
    mcp.run()


if __name__ == "__main__":
    main()
