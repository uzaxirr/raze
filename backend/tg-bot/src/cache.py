"""Redis-backed persistent cache for token metadata, identity labels, and SNS domains.

Falls back to in-memory dicts when REDIS_URL is not set or Redis is unreachable.
Every public function is safe to call without checking Redis health first.

Key schema:
  raze:mint:{mint_address}  → JSON {"s": symbol, "n": name, "d": decimals}  TTL: 30 days
  raze:id:{solana_address}  → STRING "Label (category)" or ""               TTL: 7 days
  raze:sns:{solana_address} → STRING "alice.sol" or ""                       TTL: 24 hours
"""

import json
import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)

# TTL constants (seconds)
TTL_MINT = 30 * 86400       # 30 days — token metadata is immutable on Solana
TTL_IDENTITY = 7 * 86400    # 7 days — exchange/protocol labels change rarely
TTL_SNS = 24 * 3600         # 24 hours — .sol domains can change owners
TTL_NEGATIVE = 24 * 3600    # 24 hours — "resolved but not found" entries

# Sentinel for negative cache
_NEG = ""

# ── Redis connection ──

_redis = None
_fallback = False  # True if Redis unavailable — skip retries this process lifetime


async def get_redis():
    """Lazy-init async Redis connection. Returns client or None."""
    global _redis, _fallback
    if _redis is not None:
        return _redis
    if _fallback:
        return None

    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        logger.info("REDIS_URL not set — using in-memory cache only")
        _fallback = True
        return None

    try:
        import redis.asyncio as aioredis
        _redis = aioredis.from_url(
            redis_url,
            decode_responses=True,
            socket_connect_timeout=2,
            socket_timeout=1,
            retry_on_timeout=False,
            max_connections=10,
        )
        await _redis.ping()
        logger.info("Redis cache connected")
        return _redis
    except Exception as e:
        logger.warning(f"Redis unavailable, falling back to in-memory: {e}")
        _fallback = True
        _redis = None
        return None


# ── In-memory fallback (always populated, acts as L1 cache) ──

mem_mint: dict[str, str | None] = {}
mem_identity: dict[str, str | None] = {}
mem_sns: dict[str, str | None] = {}


# ── Mint metadata ──

async def get_mint_symbol(mint: str) -> Optional[str]:
    """Get cached symbol for a mint. Returns symbol, None (negative), or None (miss)."""
    # L1: in-memory (zero overhead)
    if mint in mem_mint:
        return mem_mint[mint]

    # L2: Redis
    r = await get_redis()
    if r:
        try:
            raw = await r.get(f"raze:mint:{mint}")
            if raw is not None:
                if raw == _NEG:
                    mem_mint[mint] = None
                    return None
                data = json.loads(raw)
                symbol = data.get("s")
                mem_mint[mint] = symbol
                return symbol
        except Exception:
            pass

    return None  # True cache miss — caller should resolve via API


async def is_mint_cached(mint: str) -> bool:
    """Check if a mint has been resolved (even if result was negative)."""
    if mint in mem_mint:
        return True
    r = await get_redis()
    if r:
        try:
            return await r.exists(f"raze:mint:{mint}") > 0
        except Exception:
            pass
    return False


async def set_mint(mint: str, symbol: str, name: str = "", decimals: int = 0):
    """Cache mint metadata. Also populates in-memory L1."""
    mem_mint[mint] = symbol

    r = await get_redis()
    if r:
        try:
            value = json.dumps({"s": symbol, "n": name, "d": decimals})
            await r.set(f"raze:mint:{mint}", value, ex=TTL_MINT)
        except Exception:
            pass


async def set_mint_negative(mint: str):
    """Record that a mint couldn't be resolved (prevents repeated API calls)."""
    mem_mint[mint] = None

    r = await get_redis()
    if r:
        try:
            await r.set(f"raze:mint:{mint}", _NEG, ex=TTL_NEGATIVE)
        except Exception:
            pass


async def bulk_set_mints(mint_map: dict[str, tuple[str, str, int]]):
    """Batch-write mint metadata. Values are (symbol, name, decimals).
    Used when DAS portfolio response gives us free data."""
    for mint, (symbol, name, decimals) in mint_map.items():
        mem_mint[mint] = symbol

    r = await get_redis()
    if r and mint_map:
        try:
            pipe = r.pipeline(transaction=False)
            for mint, (symbol, name, decimals) in mint_map.items():
                value = json.dumps({"s": symbol, "n": name, "d": decimals})
                pipe.set(f"raze:mint:{mint}", value, ex=TTL_MINT)
            await pipe.execute()
        except Exception:
            pass


# ── Identity labels ──

async def get_identity(address: str) -> Optional[str]:
    """Get cached identity label. Returns label, None (negative), or None (miss)."""
    if address in mem_identity:
        return mem_identity[address]

    r = await get_redis()
    if r:
        try:
            raw = await r.get(f"raze:id:{address}")
            if raw is not None:
                label = raw if raw != _NEG else None
                mem_identity[address] = label
                return label
        except Exception:
            pass
    return None


async def is_identity_cached(address: str) -> bool:
    """Check if address identity has been resolved (even if 'unknown')."""
    if address in mem_identity:
        return True
    r = await get_redis()
    if r:
        try:
            return await r.exists(f"raze:id:{address}") > 0
        except Exception:
            pass
    return False


async def set_identity(address: str, label: Optional[str]):
    """Cache identity label. Pass None for 'resolved but unknown'."""
    mem_identity[address] = label

    r = await get_redis()
    if r:
        try:
            await r.set(f"raze:id:{address}", label or _NEG, ex=TTL_IDENTITY)
        except Exception:
            pass


# ── SNS domains ──

async def get_sns(address: str) -> Optional[str]:
    """Get cached .sol domain. Returns 'alice.sol' or None."""
    if address in mem_sns:
        return mem_sns[address]

    r = await get_redis()
    if r:
        try:
            raw = await r.get(f"raze:sns:{address}")
            if raw is not None:
                domain = raw if raw != _NEG else None
                mem_sns[address] = domain
                return domain
        except Exception:
            pass
    return None


async def set_sns(address: str, domain: Optional[str]):
    """Cache .sol domain. Pass None for 'no domain found'."""
    mem_sns[address] = domain

    r = await get_redis()
    if r:
        try:
            await r.set(f"raze:sns:{address}", domain or _NEG, ex=TTL_SNS)
        except Exception:
            pass
