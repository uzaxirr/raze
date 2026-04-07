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
    Get all SPL token balances for a wallet.

    Args:
        wallet_address: Solana wallet address
        network: Solana network ("mainnet" or "devnet"). Defaults to "mainnet".

    Returns:
        List of tokens with balances and symbols
    """
    try:
        result = await rpc_call(
            "getTokenAccountsByOwner",
            [
                wallet_address,
                {"programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},
                {"encoding": "jsonParsed"}
            ],
            network=network
        )

        if not result or "value" not in result:
            return {"wallet": wallet_address, "network": network, "tokens": [], "count": 0}

        # Extract token data
        raw_tokens = []
        for account in result["value"]:
            try:
                info = account["account"]["data"]["parsed"]["info"]
                token_amount = info.get("tokenAmount", {})
                balance = float(token_amount.get("uiAmountString", "0"))

                if balance > 0:
                    raw_tokens.append({
                        "mint": info.get("mint"),
                        "balance": balance,
                        "decimals": token_amount.get("decimals", 0)
                    })
            except (KeyError, TypeError):
                continue

        # Fetch symbols in parallel
        async def enrich_token(token):
            symbol = await get_token_symbol(token["mint"])
            return {**token, "symbol": symbol}

        tokens = await asyncio.gather(*[enrich_token(t) for t in raw_tokens])

        return {
            "wallet": wallet_address,
            "network": network,
            "tokens": list(tokens),
            "count": len(tokens)
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
    Get recent transactions for a wallet.

    Args:
        wallet_address: Solana wallet address
        limit: Number of transactions to fetch (max 25 for detail, 100 for signatures only)
        network: Solana network ("mainnet" or "devnet"). Defaults to "mainnet".

    Returns:
        List of transactions with details
    """
    try:
        # Cap limit for performance
        sig_limit = min(limit, 100)
        detail_limit = min(limit, 25)

        # Get signatures
        signatures = await rpc_call(
            "getSignaturesForAddress",
            [wallet_address, {"limit": sig_limit}],
            network=network
        )

        if not signatures:
            return {"wallet": wallet_address, "network": network, "transactions": [], "count": 0}

        # Fetch transaction details in parallel
        async def fetch_tx_detail(sig_info):
            sig = sig_info.get("signature")
            if not sig:
                return None

            try:
                tx_data = await rpc_call(
                    "getTransaction",
                    [sig, {"encoding": "jsonParsed", "maxSupportedTransactionVersion": 0}],
                    network=network
                )

                if not tx_data:
                    return None

                meta = tx_data.get("meta", {})
                fee = meta.get("fee", 0)

                # Extract transfers
                transfers = []
                instructions = tx_data.get("transaction", {}).get("message", {}).get("instructions", [])

                for inst in instructions:
                    parsed = inst.get("parsed") if isinstance(inst, dict) else None
                    if isinstance(parsed, dict) and parsed.get("type") == "transfer":
                        info = parsed.get("info", {})
                        lamports = info.get("lamports", 0)
                        # Filter spam/dust transfers below threshold
                        if lamports >= SPAM_THRESHOLD_LAMPORTS:
                            transfers.append({
                                "from": info.get("source"),
                                "to": info.get("destination"),
                                "lamports": lamports,
                                "sol": lamports_to_sol(lamports)
                            })

                return {
                    "signature": sig,
                    "timestamp": sig_info.get("blockTime"),
                    "slot": tx_data.get("slot"),
                    "fee_lamports": fee,
                    "fee_sol": lamports_to_sol(fee),
                    "status": "failed" if meta.get("err") else "success",
                    "transfers": transfers
                }
            except Exception:
                return {"signature": sig, "error": "Failed to fetch details"}

        # Parallel fetch (only for detail_limit transactions)
        tasks = [fetch_tx_detail(s) for s in signatures[:detail_limit]]
        results = await asyncio.gather(*tasks)
        transactions = [tx for tx in results if tx]

        return {
            "wallet": wallet_address,
            "network": network,
            "transactions": transactions,
            "count": len(transactions),
            "total_found": len(signatures)
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


# ===== MAIN =====
def main():
    print("Starting Solana Read MCP Server v3.0...")
    mcp.run()


if __name__ == "__main__":
    main()
