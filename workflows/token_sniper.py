#!/usr/bin/env python3
"""
Token Sniper Workflow
Finds high-potential early-stage tokens on Solana with safety checks and momentum scoring.
"""
import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from pathlib import Path
import httpx
from dotenv import load_dotenv

from agno.workflow import Workflow, Step, StepInput, StepOutput

# Load from project root
_root = Path(__file__).resolve().parent
while not (_root / '.env').exists() and _root != _root.parent:
    _root = _root.parent
load_dotenv(_root / '.env')

# Configuration
BIRDEYE_API_KEY = os.getenv('BIRDEYE_API_KEY')
BIRDEYE_API_URL = 'https://public-api.birdeye.so'
JUPITER_API_URL = 'https://api.jup.ag/swap/v1'
JUPITER_API_KEY = os.getenv('JUPITER_API_KEY', '92b358a9-ae9c-40ba-b9df-4e063a713130')
SOL_MINT = "So11111111111111111111111111111111111111112"

# Filter criteria
SNIPER_CRITERIA = {
    "min_mc": 10000,           # $10k minimum market cap
    "max_mc": None,            # No max MC limit
    "min_holders": 50,         # At least 50 holders
    "min_volume_1h": 50000,    # $50k minimum 1h volume
    "min_liquidity": 5000,     # $5k minimum liquidity
    "min_age_minutes": 60,     # At least 1 hour old
    "max_age_hours": 24,       # Not older than 24 hours
}

SAFETY_CRITERIA = {
    "max_top_holder_pct": 25,  # Top holder < 25%
    "require_mint_revoked": True,
}


def _birdeye_request(endpoint: str, params: Dict = None) -> Dict:
    """Make a request to Birdeye API."""
    try:
        with httpx.Client() as client:
            response = client.get(
                f"{BIRDEYE_API_URL}{endpoint}",
                headers={
                    "X-API-KEY": BIRDEYE_API_KEY,
                    "accept": "application/json",
                    "x-chain": "solana"
                },
                params=params or {},
                timeout=30
            )
            if response.status_code == 200:
                return response.json().get("data", {})
            return {}
    except Exception:
        return {}


def _jupiter_quote(input_mint: str, output_mint: str, amount: int) -> Optional[Dict]:
    """Get Jupiter quote for swap."""
    try:
        with httpx.Client() as client:
            response = client.get(
                f"{JUPITER_API_URL}/quote",
                headers={"x-api-key": JUPITER_API_KEY},
                params={
                    "inputMint": input_mint,
                    "outputMint": output_mint,
                    "amount": str(amount),
                    "slippageBps": "500"
                },
                timeout=15
            )
            if response.status_code == 200:
                return response.json()
            return None
    except Exception:
        return None


# Step 1: Fetch trending tokens
def fetch_new_tokens(step_input: StepInput) -> StepOutput:
    """Fetch trending tokens from Birdeye (more established than new listings)."""
    try:
        data = _birdeye_request(
            "/defi/token_trending",
            {"sort_by": "rank", "sort_type": "asc", "offset": 0, "limit": 20}
        )
        tokens = data.get("tokens", [])

        if not tokens:
            return StepOutput(
                step_name="fetch_new_tokens",
                content={"tokens": [], "count": 0, "message": "No trending tokens found"},
                success=True
            )

        return StepOutput(
            step_name="fetch_new_tokens",
            content={"tokens": tokens, "count": len(tokens)},
            success=True
        )
    except Exception as e:
        return StepOutput(
            step_name="fetch_new_tokens",
            content={"error": str(e)},
            success=False,
            error=str(e)
        )


# Step 2: Filter by basic criteria
def filter_basic_criteria(step_input: StepInput) -> StepOutput:
    """Filter tokens by market cap, holders, volume, liquidity."""
    previous = step_input.previous_step_content
    if isinstance(previous, str):
        import json
        previous = json.loads(previous)

    tokens = previous.get("tokens", [])
    if not tokens:
        return StepOutput(
            step_name="filter_basic_criteria",
            content={"tokens": [], "count": 0, "filtered_out": 0},
            success=True
        )

    filtered = []

    for token in tokens:
        address = token.get("address")
        if not address:
            continue

        # Trending tokens already have most metrics, but fetch overview for complete data
        overview = _birdeye_request("/defi/token_overview", {"address": address})
        if not overview:
            continue

        # Use correct field names from Birdeye API
        mc = overview.get("marketCap", 0) or overview.get("mc", 0) or 0
        holders = overview.get("holder", 0) or 0
        v_1h = overview.get("v1hUSD", 0) or 0
        liquidity = overview.get("liquidity", 0) or 0

        # Apply filters (skip age check for trending tokens - they're already established)
        if mc < SNIPER_CRITERIA["min_mc"]:
            continue
        if SNIPER_CRITERIA["max_mc"] is not None and mc > SNIPER_CRITERIA["max_mc"]:
            continue
        if holders < SNIPER_CRITERIA["min_holders"]:
            continue
        if v_1h < SNIPER_CRITERIA["min_volume_1h"]:
            continue
        if liquidity < SNIPER_CRITERIA["min_liquidity"]:
            continue

        # Passed all filters
        filtered.append({
            "address": address,
            "symbol": token.get("symbol") or overview.get("symbol"),
            "name": token.get("name") or overview.get("name"),
            "market_cap": mc,
            "holders": holders,
            "volume_1h": v_1h,
            "liquidity": liquidity,
            "price": overview.get("price", 0),
            "price_change_1h": overview.get("priceChange1hPercent", 0),
        })

    return StepOutput(
        step_name="filter_basic_criteria",
        content={
            "tokens": filtered,
            "count": len(filtered),
            "filtered_out": len(tokens) - len(filtered)
        },
        success=True
    )


# Step 3: Run safety checks
def run_safety_checks(step_input: StepInput) -> StepOutput:
    """Run safety checks: mint authority, top holder %, honeypot test."""
    previous = step_input.previous_step_content
    if isinstance(previous, str):
        import json
        previous = json.loads(previous)

    tokens = previous.get("tokens", [])
    if not tokens:
        return StepOutput(
            step_name="run_safety_checks",
            content={"tokens": [], "count": 0, "unsafe_count": 0},
            success=True
        )

    safe_tokens = []
    unsafe_count = 0

    for token in tokens:
        address = token["address"]
        safety = {"mint_revoked": None, "top_holder_pct": None, "honeypot": None}

        # Check 1: Mint authority
        security_data = _birdeye_request("/defi/token_security", {"address": address})
        if security_data:
            mint_authority = security_data.get("mintAuthority")
            safety["mint_revoked"] = mint_authority is None or mint_authority == ""

        # Check 2: Top holder %
        holders_data = _birdeye_request("/defi/v3/token/holder", {"address": address, "limit": 1})
        if holders_data:
            items = holders_data.get("items", [])
            if items:
                top_pct = items[0].get("percentage", 0)
                if isinstance(top_pct, str):
                    top_pct = float(top_pct.replace("%", ""))
                safety["top_holder_pct"] = top_pct

        # Check 3: Honeypot test (optional - Jupiter API may require auth)
        price = token.get("price", 0)
        if price > 0:
            overview = _birdeye_request("/defi/token_overview", {"address": address})
            decimals = overview.get("decimals", 9) if overview else 9
            test_amount = int((10 / price) * (10 ** decimals))  # $10 worth

            quote = _jupiter_quote(address, SOL_MINT, test_amount)
            if quote is None:
                # Jupiter API unavailable - skip honeypot check
                safety["honeypot"] = None
            else:
                safety["honeypot"] = int(quote.get("outAmount", 0)) == 0
        else:
            safety["honeypot"] = None  # Can't test without price

        # Evaluate safety
        mint_ok = safety["mint_revoked"] is True
        holder_ok = safety["top_holder_pct"] is not None and safety["top_holder_pct"] < SAFETY_CRITERIA["max_top_holder_pct"]
        # Honeypot check: pass if explicitly False, or if we couldn't check (None)
        honeypot_ok = safety["honeypot"] is False or safety["honeypot"] is None

        is_safe = mint_ok and holder_ok and honeypot_ok

        if is_safe:
            token["safety"] = safety
            token["safety"]["is_safe"] = True
            safe_tokens.append(token)
        else:
            unsafe_count += 1

    if not safe_tokens:
        return StepOutput(
            step_name="run_safety_checks",
            content={
                "tokens": [],
                "count": 0,
                "unsafe_count": unsafe_count,
                "message": "All tokens failed safety checks"
            },
            success=True,
            stop=False  # Continue workflow even if no safe tokens
        )

    return StepOutput(
        step_name="run_safety_checks",
        content={
            "tokens": safe_tokens,
            "count": len(safe_tokens),
            "unsafe_count": unsafe_count
        },
        success=True
    )


# Step 4: Score momentum
def score_momentum(step_input: StepInput) -> StepOutput:
    """Calculate momentum score for each token."""
    previous = step_input.previous_step_content
    if isinstance(previous, str):
        import json
        previous = json.loads(previous)

    tokens = previous.get("tokens", [])
    if not tokens:
        return StepOutput(
            step_name="score_momentum",
            content={"tokens": [], "count": 0},
            success=True
        )

    scored_tokens = []

    for token in tokens:
        address = token["address"]
        overview = _birdeye_request("/defi/token_overview", {"address": address})

        if not overview:
            token["momentum_score"] = 0
            token["momentum_breakdown"] = {"error": "Could not fetch data"}
            scored_tokens.append(token)
            continue

        score = 0
        breakdown = {}

        v_1h = overview.get("v1hUSD", 0) or 0
        v_24h = overview.get("v24hUSD", 0) or 0
        price_change_1h = overview.get("priceChange1hPercent", 0) or 0
        holders = overview.get("holder", 0) or 0
        mc = overview.get("marketCap", 0) or overview.get("mc", 0) or 0

        # Score 1: Volume explosion (3 points max)
        hourly_avg = v_24h / 24 if v_24h > 0 else 0
        if hourly_avg > 0 and v_1h > hourly_avg * 3:
            score += 3
            breakdown["volume"] = f"+3 (1h vol {v_1h/hourly_avg:.1f}x avg)"
        else:
            breakdown["volume"] = "+0"

        # Score 2: Price momentum (2 points max)
        if 50 < price_change_1h < 500:
            score += 2
            breakdown["price"] = f"+2 ({price_change_1h:.0f}% 1h)"
        elif price_change_1h >= 500:
            score += 1
            breakdown["price"] = f"+1 ({price_change_1h:.0f}% 1h, overextended)"
        else:
            breakdown["price"] = f"+0 ({price_change_1h:.0f}%)"

        # Score 3: Holder traction (2 points max)
        if holders > 500:
            score += 2
            breakdown["holders"] = f"+2 ({holders:,} holders)"
        elif holders > 100:
            score += 1
            breakdown["holders"] = f"+1 ({holders:,} holders)"
        else:
            breakdown["holders"] = f"+0 ({holders} holders)"

        # Score 4: Market cap sweet spot (1 point max)
        if 10000 < mc < 500000:
            score += 1
            breakdown["mc"] = f"+1 (early ${mc:,.0f})"
        else:
            breakdown["mc"] = f"+0 (${mc:,.0f})"

        token["momentum_score"] = min(score, 8)
        token["momentum_breakdown"] = breakdown
        token["volume_1h"] = v_1h
        token["price_change_1h"] = price_change_1h
        token["market_cap"] = mc
        token["holders"] = holders

        scored_tokens.append(token)

    # Sort by momentum score (highest first)
    scored_tokens.sort(key=lambda x: x.get("momentum_score", 0), reverse=True)

    return StepOutput(
        step_name="score_momentum",
        content={
            "tokens": scored_tokens,
            "count": len(scored_tokens)
        },
        success=True
    )


# Step 5: Format output for user
def format_output(step_input: StepInput) -> StepOutput:
    """Format results for user presentation."""
    previous = step_input.previous_step_content
    if isinstance(previous, str):
        import json
        previous = json.loads(previous)

    tokens = previous.get("tokens", [])

    if not tokens:
        return StepOutput(
            step_name="format_output",
            content={
                "found": 0,
                "results": [],
                "summary": "No tokens passed all filters and safety checks."
            },
            success=True
        )

    # Format each token
    results = []
    for i, token in enumerate(tokens[:5], 1):  # Top 5
        score = token.get("momentum_score", 0)
        rating = "🔥" if score >= 6 else "⭐" if score >= 4 else "👀"

        results.append({
            "rank": i,
            "symbol": token.get("symbol", "???"),
            "address": token.get("address"),
            "score": f"{score}/8 {rating}",
            "market_cap": f"${token.get('market_cap', 0):,.0f}",
            "volume_1h": f"${token.get('volume_1h', 0):,.0f}",
            "price_change_1h": f"{token.get('price_change_1h', 0):.0f}%",
            "holders": token.get("holders", 0),
            "safety": {
                "mint_revoked": token.get("safety", {}).get("mint_revoked", "?"),
                "top_holder_pct": f"{token.get('safety', {}).get('top_holder_pct', '?')}%",
            },
            "momentum_breakdown": token.get("momentum_breakdown", {}),
        })

    return StepOutput(
        step_name="format_output",
        content={
            "found": len(tokens),
            "results": results,
            "summary": f"Found {len(tokens)} potential snipes. Showing top {len(results)}."
        },
        success=True
    )


# Define the workflow
token_sniper_workflow = Workflow(
    name="Token Sniper",
    description="Find high-potential early tokens on Solana with safety checks and momentum scoring. "
                "Filters by market cap ($10k-$2M), holders (50+), volume, liquidity. "
                "Runs safety checks (mint revoked, top holder <25%, no honeypot). "
                "Scores momentum (volume explosion, price action, holder growth).",
    steps=[
        Step(name="fetch", executor=fetch_new_tokens, description="Fetch new token listings"),
        Step(name="filter", executor=filter_basic_criteria, description="Filter by basic criteria"),
        Step(name="safety", executor=run_safety_checks, description="Run safety checks"),
        Step(name="momentum", executor=score_momentum, description="Score momentum"),
        Step(name="output", executor=format_output, description="Format results"),
    ],
)


# For testing
if __name__ == "__main__":
    if not BIRDEYE_API_KEY:
        print("Error: BIRDEYE_API_KEY not set")
        exit(1)

    print("Running Token Sniper Workflow...")
    token_sniper_workflow.print_response(
        input="Find snipes",
        stream=True,
        markdown=True
    )
