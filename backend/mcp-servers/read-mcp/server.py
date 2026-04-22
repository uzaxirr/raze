#!/usr/bin/env python3
"""
Solana Read MCP Server
Simple, focused tools for reading Solana blockchain data via Helius RPC.
"""
import os
import asyncio
import json
import subprocess
import tempfile
from typing import Dict, Any, List
from pathlib import Path

import httpx
from fastmcp import FastMCP
from dotenv import load_dotenv
from async_lru import alru_cache

# Load from project root
_root = Path(__file__).resolve().parent
while not (_root / '.env').exists() and _root != _root.parent:
    _root = _root.parent
load_dotenv(_root / '.env')

# ===== CONFIG =====
HELIUS_API_KEY = os.getenv('HELIUS_API_KEY')
BIRDEYE_API_KEY = os.getenv('BIRDEYE_API_KEY')

if not HELIUS_API_KEY:
    raise ValueError("HELIUS_API_KEY is required")

BIRDEYE_API_URL = "https://public-api.birdeye.so"
LAMPORTS_PER_SOL = 1_000_000_000
SPAM_THRESHOLD_LAMPORTS = 10_000  # 0.00001 SOL - filter dust/spam transfers
RPC_TIMEOUT = 30
VALID_NETWORKS = {"mainnet", "devnet"}
IDL_GUESSER_PATH = os.getenv("IDL_GUESSER_PATH", "/usr/local/bin/idl-guesser")

# ===== MCP SERVER =====
mcp = FastMCP(name="solana-read", version="3.0.0")


# ===== HELPERS =====
def lamports_to_sol(lamports: int) -> float:
    return lamports / LAMPORTS_PER_SOL


def get_rpc_url(network: str = "mainnet") -> str:
    """Construct Helius RPC URL for the specified network."""
    if network not in VALID_NETWORKS:
        raise ValueError(f"Invalid network '{network}'. Must be: mainnet or devnet")
    return f"https://{network}.helius-rpc.com/?api-key={HELIUS_API_KEY}"


def summarize_idl(idl: dict) -> dict:
    """Convert raw IDL to human-readable summary for agent context."""
    summary = {
        'program': idl.get('address', 'unknown'),
        'name': idl.get('metadata', {}).get('name', 'unknown'),
        'version': idl.get('metadata', {}).get('version', 'unknown'),
    }

    # Summarize instructions
    instructions = []
    for ix in idl.get('instructions', []):
        args = []
        for arg in ix.get('args', []):
            arg_type = arg.get('type')
            if isinstance(arg_type, dict):
                if 'defined' in arg_type:
                    arg_type = arg_type['defined'].get('name', 'complex')
                else:
                    arg_type = 'complex'
            args.append(f"{arg.get('name')}: {arg_type}")

        instructions.append({
            'name': ix.get('name'),
            'accounts': [acc.get('name') for acc in ix.get('accounts', [])],
            'args': args
        })
    summary['instructions'] = instructions

    # Account types
    summary['accounts'] = [acc.get('name') for acc in idl.get('accounts', [])]

    # Key errors (limit to 5)
    errors = [f"{e.get('name')}: {e.get('msg')}" for e in idl.get('errors', [])[:5]]
    summary['errors'] = errors

    return summary


async def rpc_call(method: str, params: List[Any] = None, network: str = "mainnet") -> Dict[str, Any]:
    """Make RPC call to Helius for the specified network.

    Args:
        method: RPC method name
        params: RPC parameters
        network: Solana network ("mainnet" or "devnet")
    """
    rpc_url = get_rpc_url(network)
    async with httpx.AsyncClient(timeout=RPC_TIMEOUT) as client:
        response = await client.post(
            rpc_url,
            json={
                "jsonrpc": "2.0",
                "id": 1,
                "method": method,
                "params": params or []
            }
        )
        data = response.json()
        if "error" in data:
            raise Exception(data["error"].get("message", str(data["error"])))
        return data.get("result")


@alru_cache(maxsize=500, ttl=3600)
async def get_token_metadata(mint: str) -> dict | None:
    """Get token metadata from Birdeye. Cached 1 hour."""
    if not BIRDEYE_API_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                f"{BIRDEYE_API_URL}/defi/v3/token/meta-data/single",
                headers={"X-API-KEY": BIRDEYE_API_KEY, "x-chain": "solana"},
                params={"address": mint}
            )
            if response.status_code == 200:
                return response.json().get("data")
    except Exception:
        pass
    return None


async def get_token_symbol(mint: str) -> str:
    """Get token symbol from Birdeye or return truncated address."""
    # Well-known tokens (instant)
    well_known = {
        "So11111111111111111111111111111111111111112": "SOL",
        "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": "USDC",
        "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": "USDT",
    }
    if mint in well_known:
        return well_known[mint]

    # Try Birdeye
    metadata = await get_token_metadata(mint)
    if metadata and metadata.get("symbol"):
        return metadata["symbol"]

    return mint[:8] + "..."


# ===== TOOLS =====

@mcp.tool()
async def get_wallet_balance(wallet_address: str, network: str = "mainnet") -> Dict[str, Any]:
    """
    Get SOL balance for a wallet.

    Args:
        wallet_address: Solana wallet address
        network: Solana network ("mainnet" or "devnet"). Defaults to "mainnet".

    Returns:
        SOL balance in lamports and human-readable format
    """
    try:
        result = await rpc_call("getBalance", [wallet_address], network=network)
        lamports = result.get("value", 0)
        sol = lamports_to_sol(lamports)

        return {
            "wallet": wallet_address,
            "network": network,
            "lamports": lamports,
            "sol": round(sol, 4),
            "formatted": f"{sol:.4f} SOL"
        }
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
async def get_token_balances(wallet_address: str, network: str = "mainnet") -> Dict[str, Any]:
    """
    Get all token balances for a wallet with USD values using Helius DAS API.

    Args:
        wallet_address: Solana wallet address
        network: Solana network ("mainnet" or "devnet"). Defaults to "mainnet".

    Returns:
        List of tokens with balances, symbols, prices, and USD values
    """
    try:
        rpc_url = get_rpc_url(network)
        async with httpx.AsyncClient(timeout=RPC_TIMEOUT) as client:
            resp = await client.post(rpc_url, json={
                "jsonrpc": "2.0", "id": 1,
                "method": "getAssetsByOwner",
                "params": {
                    "ownerAddress": wallet_address,
                    "displayOptions": {"showFungible": True, "showNativeBalance": True},
                }
            })

        data = resp.json().get("result", {})

        # Native SOL
        native = data.get("nativeBalance", {})
        sol_balance = native.get("lamports", 0) / LAMPORTS_PER_SOL
        sol_price = native.get("price_per_sol", 0)
        sol_usd = sol_balance * sol_price
        total_usd = sol_usd

        tokens = []
        for item in data.get("items", []):
            content = item.get("content", {})
            metadata = content.get("metadata", {})
            symbol = metadata.get("symbol", "")
            name = metadata.get("name", "")
            if not symbol:
                continue

            token_info = item.get("token_info", {})
            balance = token_info.get("balance", 0)
            decimals = token_info.get("decimals", 0)
            human_balance = balance / (10 ** decimals) if decimals else 0

            if human_balance > 0:
                price = token_info.get("price_info", {}).get("price_per_token", 0)
                usd = human_balance * price if price else 0
                total_usd += usd
                tokens.append({
                    "mint": item.get("id", ""),
                    "symbol": symbol,
                    "name": name,
                    "balance": round(human_balance, 6),
                    "decimals": decimals,
                    "price_usd": round(price, 6) if price else None,
                    "value_usd": round(usd, 2) if usd else None,
                })

        # Sort by USD value descending
        tokens.sort(key=lambda t: t.get("value_usd") or 0, reverse=True)

        return {
            "wallet": wallet_address,
            "network": network,
            "sol_balance": round(sol_balance, 6),
            "sol_price_usd": round(sol_price, 2),
            "sol_value_usd": round(sol_usd, 2),
            "tokens": tokens,
            "count": len(tokens),
            "total_portfolio_usd": round(total_usd, 2),
        }
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
async def get_recent_transactions(
    wallet_address: str,
    limit: int = 10,
    network: str = "mainnet"
) -> Dict[str, Any]:
    """
    Get recent transactions for a wallet with human-readable descriptions using Helius Enhanced Transactions API.

    Args:
        wallet_address: Solana wallet address
        limit: Number of transactions to fetch (max 25)
        network: Solana network ("mainnet" or "devnet"). Defaults to "mainnet".

    Returns:
        List of transactions with type, description, transfers, and timestamps
    """
    try:
        tx_limit = min(limit, 25)

        async with httpx.AsyncClient(timeout=RPC_TIMEOUT) as client:
            resp = await client.get(
                f"https://api.helius.xyz/v0/addresses/{wallet_address}/transactions",
                params={"api-key": HELIUS_API_KEY, "limit": tx_limit}
            )

        if resp.status_code != 200:
            return {"error": f"Helius API error: {resp.status_code}", "wallet": wallet_address}

        raw_txs = resp.json()
        import time
        now = int(time.time())

        transactions = []
        for tx in raw_txs:
            timestamp = tx.get("timestamp", 0)
            ago = now - timestamp if timestamp else 0

            # Human-readable time
            if ago < 60:
                time_ago = f"{ago}s ago"
            elif ago < 3600:
                time_ago = f"{ago // 60}min ago"
            elif ago < 86400:
                time_ago = f"{ago // 3600}hr ago"
            else:
                time_ago = f"{ago // 86400}d ago"

            # Token transfers
            token_transfers = []
            for xf in tx.get("tokenTransfers", []):
                token_transfers.append({
                    "from": xf.get("fromUserAccount"),
                    "to": xf.get("toUserAccount"),
                    "amount": xf.get("tokenAmount", 0),
                    "mint": xf.get("mint"),
                })

            # Native SOL transfers
            sol_transfers = []
            for xf in tx.get("nativeTransfers", []):
                amt = xf.get("amount", 0) / LAMPORTS_PER_SOL
                if amt >= 0.000001:
                    sol_transfers.append({
                        "from": xf.get("fromUserAccount"),
                        "to": xf.get("toUserAccount"),
                        "amount_sol": round(amt, 6),
                    })

            transactions.append({
                "signature": tx.get("signature"),
                "type": tx.get("type", "UNKNOWN"),
                "description": tx.get("description", ""),
                "timestamp": timestamp,
                "time_ago": time_ago,
                "fee_sol": tx.get("fee", 0) / LAMPORTS_PER_SOL,
                "token_transfers": token_transfers[:5],
                "sol_transfers": sol_transfers[:5],
            })

        return {
            "wallet": wallet_address,
            "network": network,
            "transactions": transactions,
            "count": len(transactions),
        }
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
async def get_transaction_detail(signature: str, network: str = "mainnet", return_logs: bool = False) -> Dict[str, Any]:
    """
    Get detailed information about a specific transaction.

    Args:
        signature: Transaction signature/hash
        network: Solana network ("mainnet" or "devnet"). Defaults to "mainnet".
        return_logs: Whether to include program logs (verbose). Defaults to False.

    Returns:
        Full transaction details
    """
    try:
        tx_data = await rpc_call(
            "getTransaction",
            [signature, {"encoding": "jsonParsed", "maxSupportedTransactionVersion": 0}],
            network=network
        )

        if not tx_data:
            return {"error": "Transaction not found"}

        meta = tx_data.get("meta", {})
        message = tx_data.get("transaction", {}).get("message", {})

        return {
            "signature": signature,
            "network": network,
            "slot": tx_data.get("slot"),
            "timestamp": tx_data.get("blockTime"),
            "fee_lamports": meta.get("fee", 0),
            "fee_sol": lamports_to_sol(meta.get("fee", 0)),
            "status": "failed" if meta.get("err") else "success",
            "error": meta.get("err"),
            "accounts": message.get("accountKeys", []),
            "instructions": message.get("instructions", []),
            "pre_balances": meta.get("preBalances", []),
            "post_balances": meta.get("postBalances", []),
            **({"logs": meta.get("logMessages", [])} if return_logs else {})
        }
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
async def get_program_idl(program_id: str, network: str = "mainnet") -> Dict[str, Any]:
    """
    Get the IDL for an Anchor program (summarized for readability).

    Args:
        program_id: Solana program address
        network: Solana network ("mainnet" or "devnet"). Defaults to "mainnet".

    Returns:
        Summarized IDL with instructions, accounts, and errors
    """
    try:
        rpc_url = get_rpc_url(network)

        # Run IDLGuesser in temp directory
        with tempfile.TemporaryDirectory() as tmpdir:
            result = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: subprocess.run(
                    [IDL_GUESSER_PATH, program_id, "-u", rpc_url],
                    cwd=tmpdir,
                    capture_output=True,
                    text=True,
                    timeout=30
                )
            )

            if result.returncode != 0:
                return {"error": f"IDL fetch failed: {result.stderr.strip()}"}

            # Read generated JSON file
            idl_file = os.path.join(tmpdir, f"{program_id}.json")
            if not os.path.exists(idl_file):
                return {"error": "IDL file not generated"}

            with open(idl_file) as f:
                raw_idl = json.load(f)

        # Return summarized version
        summary = summarize_idl(raw_idl)
        summary['network'] = network

        return summary

    except subprocess.TimeoutExpired:
        return {"error": "IDL fetch timed out"}
    except Exception as e:
        return {"error": str(e)}


@mcp.tool()
async def get_wallet_identity(
    addresses: str,
) -> Dict[str, Any]:
    """
    Identify known wallets/programs by address — returns entity name, category, and tags.
    Covers exchanges (Binance, Coinbase), DeFi protocols (Jupiter, Raydium, Drift),
    DAOs, KOLs, hackers, scammers, and 10K+ labeled entities.

    Use this to answer "who is this address?" or to investigate counterparties in transactions.
    Returns type="unknown" for normal user wallets.

    Args:
        addresses: One or more Solana addresses, comma-separated. Max 100.
                   Example: "2ojv9BAiH...,JUP6Lkb..."

    Returns:
        List of identity objects with name, type, category, tags, website, twitter, domainNames.
    """
    addr_list = [a.strip() for a in addresses.split(",") if a.strip()]
    if not addr_list:
        return {"status": "error", "error": "No addresses provided"}
    if len(addr_list) > 100:
        addr_list = addr_list[:100]

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                "https://api.helius.xyz/v1/wallet/batch-identity",
                params={"api-key": HELIUS_API_KEY},
                json={"addresses": addr_list},
            )
            if resp.status_code != 200:
                return {"status": "error", "error": f"Helius Identity API error: {resp.status_code}"}

            results = resp.json()
            # Filter to only include known entities (type != "unknown")
            known = [r for r in results if r.get("type") != "unknown"]
            unknown_count = len(results) - len(known)

            return {
                "status": "success",
                "identities": known,
                "known_count": len(known),
                "unknown_count": unknown_count,
                "total": len(results),
            }

    except httpx.TimeoutException:
        return {"status": "error", "error": "Identity lookup timed out"}
    except Exception as e:
        return {"status": "error", "error": str(e)}


# ===== MAIN =====
def main():
    print("Starting Solana Read MCP Server v3.0...")
    mcp.run()


if __name__ == "__main__":
    main()
