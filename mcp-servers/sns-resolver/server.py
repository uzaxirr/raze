#!/usr/bin/env python3
"""
SNS Resolver MCP Server
Resolves Solana Name Service (SNS) domains to wallet addresses and vice versa.
"""
import os
from pathlib import Path
from typing import Dict, Any
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
    'api_url': 'https://sns-sdk-proxy.bonfida.workers.dev',
    'timeout': int(os.getenv('TIMEOUT', '30')),
    'debug': os.getenv('DEBUG', 'false').lower() == 'true'
}

# MCP Server Setup
mcp = FastMCP(name="sns-resolver")


@mcp.tool()
async def resolve_domain(domain: str) -> Dict[str, Any]:
    """
    Resolve an SNS domain to its wallet address.

    Args:
        domain: The SNS domain to resolve (e.g., 'toly.sol' or 'irfan.sol')

    Returns:
        Dictionary with the resolved wallet address

    Example:
        resolve_domain("toly.sol") -> {"domain": "toly.sol", "wallet": "..."}
    """
    # Normalize domain
    domain = domain.strip().lower()
    if not domain.endswith('.sol'):
        domain = f"{domain}.sol"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{CONFIG['api_url']}/resolve/{domain}",
                timeout=CONFIG['timeout']
            )

            if response.status_code == 200:
                data = response.json()
                if data.get("s") == "ok":
                    return {
                        "status": "success",
                        "domain": domain,
                        "wallet": data.get("result")
                    }
                else:
                    return {
                        "status": "error",
                        "domain": domain,
                        "error": "Domain not found"
                    }
            else:
                return {
                    "status": "error",
                    "domain": domain,
                    "error": f"Domain not found or invalid (status: {response.status_code})"
                }

    except httpx.TimeoutException:
        return {"status": "error", "domain": domain, "error": "Request timed out"}
    except Exception as e:
        return {"status": "error", "domain": domain, "error": str(e)}


@mcp.tool()
async def get_domains(wallet_address: str) -> Dict[str, Any]:
    """
    Get all SNS domains owned by a wallet address.

    Args:
        wallet_address: The Solana wallet address to look up

    Returns:
        Dictionary with list of domains owned by the wallet

    Example:
        get_domains("52nCnLjs2ArzLyWDe97F9DgkjUiAUi6mseaLMqbWr1Ng") -> {"domains": ["irfan.sol", ...]}
    """
    wallet_address = wallet_address.strip()

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{CONFIG['api_url']}/domains/{wallet_address}",
                timeout=CONFIG['timeout']
            )

            if response.status_code == 200:
                data = response.json()
                if data.get("s") == "ok":
                    results = data.get("result", [])
                    # Extract domain names and add .sol suffix
                    domains = [f"{item['domain']}.sol" for item in results]
                    return {
                        "status": "success",
                        "wallet": wallet_address,
                        "domains": domains,
                        "count": len(domains)
                    }
                else:
                    return {
                        "status": "error",
                        "wallet": wallet_address,
                        "error": "No domains found"
                    }
            else:
                return {
                    "status": "error",
                    "wallet": wallet_address,
                    "error": f"Failed to fetch domains (status: {response.status_code})"
                }

    except httpx.TimeoutException:
        return {"status": "error", "wallet": wallet_address, "error": "Request timed out"}
    except Exception as e:
        return {"status": "error", "wallet": wallet_address, "error": str(e)}


def main():
    """Run the MCP server"""
    if CONFIG['debug']:
        print(f"Starting {mcp.name} in debug mode...")
        print(f"API URL: {CONFIG['api_url']}")

    mcp.run()


if __name__ == "__main__":
    main()
