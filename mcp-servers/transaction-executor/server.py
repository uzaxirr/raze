#!/usr/bin/env python3
"""
Transaction Executor MCP Server
Provides tools for sending SOL, SPL tokens, and swapping via Jupiter.
"""
import os
import base64
import logging
from pathlib import Path
from typing import Dict, Any, Optional

import httpx
from fastmcp import FastMCP
from dotenv import load_dotenv

from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.system_program import TransferParams, transfer
from solders.message import Message
from solders.transaction import Transaction
from solders.hash import Hash
from solders.instruction import Instruction, AccountMeta

from token_registry import (
    resolve_token,
    amount_to_lamports,
    lamports_to_amount,
    get_token_symbol,
)
from privy_signer import PrivySigner
from jupiter import JupiterClient

# Load from project root
_root = Path(__file__).resolve().parent
while not (_root / '.env').exists() and _root != _root.parent:
    _root = _root.parent
load_dotenv(_root / '.env')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
SOLANA_RPC_URL = os.getenv("SOLANA_RPC_URL", "https://api.mainnet-beta.solana.com")

# SPL Token Program ID
TOKEN_PROGRAM_ID = Pubkey.from_string("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
ASSOCIATED_TOKEN_PROGRAM_ID = Pubkey.from_string("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL")

# Dummy blockhash - Privy will fill in the real one
DUMMY_BLOCKHASH = Hash.from_string("11111111111111111111111111111111")

# Initialize MCP server
mcp = FastMCP(name="transaction-executor")

# Lazy-initialized clients
_jupiter_client = None

# Constants
LAMPORTS_PER_SOL = 1_000_000_000


def get_rpc_url(network: str = "mainnet") -> str:
    """Get RPC URL for the specified network."""
    if network == "devnet":
        return "https://api.devnet.solana.com"
    return "https://api.mainnet-beta.solana.com"


async def get_sol_balance(wallet_address: str, network: str = "mainnet") -> int:
    """Get SOL balance in lamports."""
    rpc_url = get_rpc_url(network)
    async with httpx.AsyncClient() as client:
        response = await client.post(
            rpc_url,
            json={
                "jsonrpc": "2.0",
                "id": 1,
                "method": "getBalance",
                "params": [wallet_address],
            },
        )
        result = response.json()
        return result.get("result", {}).get("value", 0)


def get_privy_signer(network: str = "mainnet") -> PrivySigner:
    """Get a Privy signer for the specified network."""
    # Create new signer with correct network - don't cache since network varies per user
    return PrivySigner(network=network)


def get_jupiter_client() -> JupiterClient:
    """Get or create the Jupiter client (lazy initialization)."""
    global _jupiter_client
    if _jupiter_client is None:
        _jupiter_client = JupiterClient()
    return _jupiter_client


def get_associated_token_address(owner: Pubkey, mint: Pubkey) -> Pubkey:
    """Derive the associated token address for an owner and mint."""
    seeds = [
        bytes(owner),
        bytes(TOKEN_PROGRAM_ID),
        bytes(mint),
    ]
    return Pubkey.find_program_address(seeds, ASSOCIATED_TOKEN_PROGRAM_ID)[0]


async def get_token_account_info(wallet_address: str, mint_address: str) -> Optional[Dict[str, Any]]:
    """Get token account info from RPC."""
    owner = Pubkey.from_string(wallet_address)
    mint = Pubkey.from_string(mint_address)
    ata = get_associated_token_address(owner, mint)

    async with httpx.AsyncClient() as client:
        response = await client.post(
            SOLANA_RPC_URL,
            json={
                "jsonrpc": "2.0",
                "id": 1,
                "method": "getAccountInfo",
                "params": [str(ata), {"encoding": "jsonParsed"}],
            },
        )
        result = response.json()
        if result.get("result", {}).get("value"):
            return {"address": str(ata), "exists": True}
        return {"address": str(ata), "exists": False}


def build_sol_transfer_transaction(
    from_pubkey: Pubkey,
    to_pubkey: Pubkey,
    lamports: int,
) -> Transaction:
    """Build a SOL transfer transaction."""
    transfer_ix = transfer(
        TransferParams(
            from_pubkey=from_pubkey,
            to_pubkey=to_pubkey,
            lamports=lamports,
        )
    )

    message = Message.new_with_blockhash(
        [transfer_ix],
        from_pubkey,
        DUMMY_BLOCKHASH,
    )

    return Transaction.new_unsigned(message)


def build_create_ata_instruction(
    payer: Pubkey,
    owner: Pubkey,
    mint: Pubkey,
) -> Instruction:
    """Build instruction to create an associated token account."""
    ata = get_associated_token_address(owner, mint)

    return Instruction(
        program_id=ASSOCIATED_TOKEN_PROGRAM_ID,
        accounts=[
            AccountMeta(pubkey=payer, is_signer=True, is_writable=True),
            AccountMeta(pubkey=ata, is_signer=False, is_writable=True),
            AccountMeta(pubkey=owner, is_signer=False, is_writable=False),
            AccountMeta(pubkey=mint, is_signer=False, is_writable=False),
            AccountMeta(pubkey=Pubkey.from_string("11111111111111111111111111111111"), is_signer=False, is_writable=False),
            AccountMeta(pubkey=TOKEN_PROGRAM_ID, is_signer=False, is_writable=False),
        ],
        data=bytes(),
    )


def build_spl_transfer_instruction(
    source: Pubkey,
    destination: Pubkey,
    owner: Pubkey,
    amount: int,
) -> Instruction:
    """Build SPL token transfer instruction."""
    # Transfer instruction discriminator (3) + amount (u64)
    data = bytes([3]) + amount.to_bytes(8, "little")

    return Instruction(
        program_id=TOKEN_PROGRAM_ID,
        accounts=[
            AccountMeta(pubkey=source, is_signer=False, is_writable=True),
            AccountMeta(pubkey=destination, is_signer=False, is_writable=True),
            AccountMeta(pubkey=owner, is_signer=True, is_writable=False),
        ],
        data=data,
    )


@mcp.tool()
async def send_sol(
    wallet_id: str,
    from_address: str,
    to_address: str,
    amount_sol: float,
    network: str = "mainnet",
) -> Dict[str, Any]:
    """
    Send SOL to an address.

    Args:
        wallet_id: Privy wallet ID for signing
        from_address: Sender's wallet address
        to_address: Recipient's wallet address
        amount_sol: Amount of SOL to send
        network: Solana network ("mainnet" or "devnet"). Defaults to "mainnet".

    Returns:
        Transaction result with signature
    """
    try:
        # Convert to lamports
        lamports = amount_to_lamports(amount_sol, "SOL")

        # Verify Privy wallet address matches our from_address
        privy_signer = get_privy_signer(network)
        privy_address = await privy_signer.get_wallet_address(wallet_id)
        if privy_address != from_address:
            logger.error(f"Wallet mismatch! Privy has {privy_address}, we have {from_address}")
            return {
                "status": "error",
                "error": "wallet_mismatch",
                "message": f"Wallet address mismatch. Please contact support.",
                "details": {"privy": privy_address, "stored": from_address}
            }

        # Check sender has enough SOL (include ~0.001 SOL for fees)
        balance = await get_sol_balance(from_address, network)
        required = lamports + 1_000_000  # amount + ~0.001 SOL for fees

        if balance == 0:
            return {
                "status": "error",
                "error": "wallet_empty",
                "message": "Your wallet has 0 SOL. Fund it first before sending.",
            }

        if balance < required:
            available_sol = balance / LAMPORTS_PER_SOL
            return {
                "status": "error",
                "error": "insufficient_balance",
                "message": f"Not enough SOL. You have {available_sol:.4f} SOL but need {amount_sol} + fees.",
            }

        logger.info(f"Building SOL transfer: {amount_sol} SOL ({lamports} lamports)")
        logger.info(f"From: {from_address} (wallet_id: {wallet_id})")
        logger.info(f"To: {to_address}")
        logger.info(f"Current balance: {balance / LAMPORTS_PER_SOL:.4f} SOL")

        # Build transaction
        from_pubkey = Pubkey.from_string(from_address)
        to_pubkey = Pubkey.from_string(to_address)

        tx = build_sol_transfer_transaction(from_pubkey, to_pubkey, lamports)

        # Serialize to base64
        tx_bytes = bytes(tx)
        tx_base64 = base64.b64encode(tx_bytes).decode()
        logger.info(f"Transaction size: {len(tx_bytes)} bytes")

        # Sign and send via Privy
        logger.info(f"Sending via Privy on {network}")
        result = await privy_signer.sign_and_send_transaction(
            wallet_id=wallet_id,
            transaction_base64=tx_base64,
        )

        return {
            "status": "success",
            "type": "sol_transfer",
            "amount": amount_sol,
            "to": to_address,
            "network": network,
            "signature": result["signature"],
            "explorer_url": result["explorer_url"],
        }

    except Exception as e:
        logger.exception(f"SOL transfer failed: {e}")
        return {
            "status": "error",
            "error": str(e),
        }


@mcp.tool()
async def send_token(
    wallet_id: str,
    from_address: str,
    to_address: str,
    token: str,
    amount: float,
    network: str = "mainnet",
) -> Dict[str, Any]:
    """
    Send SPL tokens to an address.

    Args:
        wallet_id: Privy wallet ID for signing
        from_address: Sender's wallet address
        to_address: Recipient's wallet address
        token: Token symbol (e.g., "USDC") or mint address
        amount: Amount of tokens to send
        network: Solana network ("mainnet" or "devnet"). Defaults to "mainnet".

    Returns:
        Transaction result with signature
    """
    try:
        # Resolve token
        mint_address = resolve_token(token)
        mint = Pubkey.from_string(mint_address)
        token_symbol = get_token_symbol(mint_address) or token

        # Convert to smallest units
        token_amount = amount_to_lamports(amount, token)

        # Verify Privy wallet address matches
        privy_signer = get_privy_signer(network)
        privy_address = await privy_signer.get_wallet_address(wallet_id)
        if privy_address != from_address:
            logger.error(f"Wallet mismatch! Privy has {privy_address}, we have {from_address}")
            return {
                "status": "error",
                "error": "wallet_mismatch",
                "message": f"Wallet address mismatch. Please contact support.",
            }

        # Check SOL balance for fees
        sol_balance = await get_sol_balance(from_address, network)

        if sol_balance == 0:
            return {
                "status": "error",
                "error": "wallet_empty",
                "message": "Your wallet has 0 SOL. Need SOL for transaction fees.",
            }

        # Need ~0.002 SOL for fees (more if creating ATA)
        if sol_balance < 3_000_000:  # ~0.003 SOL
            available_sol = sol_balance / LAMPORTS_PER_SOL
            return {
                "status": "error",
                "error": "insufficient_sol_for_fees",
                "message": f"Need ~0.003 SOL for fees. You only have {available_sol:.4f} SOL.",
            }

        logger.info(f"Building token transfer: {amount} {token_symbol} to {to_address} on {network}")

        from_pubkey = Pubkey.from_string(from_address)
        to_pubkey = Pubkey.from_string(to_address)

        # Get ATAs
        source_ata = get_associated_token_address(from_pubkey, mint)
        dest_ata = get_associated_token_address(to_pubkey, mint)

        # Check if destination ATA exists
        dest_info = await get_token_account_info(to_address, mint_address)

        instructions = []

        # Create destination ATA if needed
        if not dest_info["exists"]:
            logger.info(f"Creating ATA for recipient: {dest_ata}")
            create_ata_ix = build_create_ata_instruction(from_pubkey, to_pubkey, mint)
            instructions.append(create_ata_ix)

        # Build transfer instruction
        transfer_ix = build_spl_transfer_instruction(
            source=source_ata,
            destination=dest_ata,
            owner=from_pubkey,
            amount=token_amount,
        )
        instructions.append(transfer_ix)

        # Build transaction
        message = Message.new_with_blockhash(
            instructions,
            from_pubkey,
            DUMMY_BLOCKHASH,
        )
        tx = Transaction.new_unsigned(message)

        # Serialize to base64
        tx_bytes = bytes(tx)
        tx_base64 = base64.b64encode(tx_bytes).decode()

        # Sign and send via Privy
        result = await privy_signer.sign_and_send_transaction(
            wallet_id=wallet_id,
            transaction_base64=tx_base64,
        )

        return {
            "status": "success",
            "type": "token_transfer",
            "token": token_symbol,
            "mint": mint_address,
            "amount": amount,
            "to": to_address,
            "network": network,
            "signature": result["signature"],
            "explorer_url": result["explorer_url"],
        }

    except Exception as e:
        logger.exception(f"Token transfer failed: {e}")
        return {
            "status": "error",
            "error": str(e),
        }


@mcp.tool()
async def swap_tokens(
    wallet_id: str,
    wallet_address: str,
    from_token: str,
    to_token: str,
    amount: float,
    slippage_bps: int = 50,
    network: str = "mainnet",
) -> Dict[str, Any]:
    """
    Swap tokens using Jupiter aggregator.

    Args:
        wallet_id: Privy wallet ID for signing
        wallet_address: User's wallet address
        from_token: Source token symbol (e.g., "SOL") or mint address
        to_token: Destination token symbol (e.g., "USDC") or mint address
        amount: Amount of source token to swap
        slippage_bps: Slippage tolerance in basis points (50 = 0.5%)
        network: Solana network ("mainnet" or "devnet"). Defaults to "mainnet".

    Returns:
        Swap result with amounts and signature
    """
    try:
        # Resolve tokens
        input_mint = resolve_token(from_token)
        output_mint = resolve_token(to_token)

        from_symbol = get_token_symbol(input_mint) or from_token
        to_symbol = get_token_symbol(output_mint) or to_token

        # Convert to smallest units
        input_amount = amount_to_lamports(amount, from_token)

        # Verify Privy wallet address matches
        privy_signer = get_privy_signer(network)
        privy_address = await privy_signer.get_wallet_address(wallet_id)
        if privy_address != wallet_address:
            logger.error(f"Wallet mismatch! Privy has {privy_address}, we have {wallet_address}")
            return {
                "status": "error",
                "error": "wallet_mismatch",
                "message": f"Wallet address mismatch. Please contact support.",
            }

        # Check SOL balance for fees (and for SOL swaps, the full amount)
        sol_balance = await get_sol_balance(wallet_address, network)
        is_sol_input = input_mint == "So11111111111111111111111111111111111111112"

        if sol_balance == 0:
            return {
                "status": "error",
                "error": "wallet_empty",
                "message": "Your wallet has 0 SOL. Fund it first before swapping.",
            }

        if is_sol_input:
            # Swapping SOL - need amount + fees
            required = input_amount + 5_000_000  # amount + ~0.005 SOL for swap fees
            if sol_balance < required:
                available_sol = sol_balance / LAMPORTS_PER_SOL
                return {
                    "status": "error",
                    "error": "insufficient_balance",
                    "message": f"Not enough SOL. You have {available_sol:.4f} SOL but need {amount} + fees.",
                }
        else:
            # Swapping tokens - just need SOL for fees
            if sol_balance < 5_000_000:  # ~0.005 SOL for fees
                available_sol = sol_balance / LAMPORTS_PER_SOL
                return {
                    "status": "error",
                    "error": "insufficient_sol_for_fees",
                    "message": f"Need ~0.005 SOL for fees. You only have {available_sol:.4f} SOL.",
                }

        logger.info(f"Getting Jupiter quote: {amount} {from_symbol} -> {to_symbol} on {network}")

        # Get quote and swap transaction from Jupiter
        swap_result = await get_jupiter_client().get_swap_quote_and_transaction(
            input_mint=input_mint,
            output_mint=output_mint,
            amount=input_amount,
            user_public_key=wallet_address,
            slippage_bps=slippage_bps,
        )

        # Jupiter returns a ready-to-sign base64 transaction
        swap_transaction = swap_result["swap_transaction"]

        logger.info(f"Signing swap transaction via Privy on {network}")

        # Sign and send via Privy
        result = await privy_signer.sign_and_send_transaction(
            wallet_id=wallet_id,
            transaction_base64=swap_transaction,
        )

        # Calculate output amount
        output_amount = lamports_to_amount(swap_result["output_amount"], to_token)

        return {
            "status": "success",
            "type": "swap",
            "from_token": from_symbol,
            "to_token": to_symbol,
            "input_amount": amount,
            "output_amount": output_amount,
            "network": network,
            "price_impact": swap_result.get("price_impact_pct"),
            "signature": result["signature"],
            "explorer_url": result["explorer_url"],
        }

    except Exception as e:
        logger.exception(f"Swap failed: {e}")
        return {
            "status": "error",
            "error": str(e),
        }


@mcp.tool()
async def get_swap_quote(
    from_token: str,
    to_token: str,
    amount: float,
    slippage_bps: int = 50,
) -> Dict[str, Any]:
    """
    Get a swap quote without executing (preview).

    Args:
        from_token: Source token symbol or mint address
        to_token: Destination token symbol or mint address
        amount: Amount of source token
        slippage_bps: Slippage tolerance in basis points

    Returns:
        Quote with expected output and price impact
    """
    try:
        input_mint = resolve_token(from_token)
        output_mint = resolve_token(to_token)

        from_symbol = get_token_symbol(input_mint) or from_token
        to_symbol = get_token_symbol(output_mint) or to_token

        input_amount = amount_to_lamports(amount, from_token)

        quote = await get_jupiter_client().get_quote(
            input_mint=input_mint,
            output_mint=output_mint,
            amount=input_amount,
            slippage_bps=slippage_bps,
        )

        output_amount = lamports_to_amount(int(quote.get("outAmount", 0)), to_token)

        return {
            "status": "success",
            "from_token": from_symbol,
            "to_token": to_symbol,
            "input_amount": amount,
            "output_amount": output_amount,
            "price_impact_pct": quote.get("priceImpactPct"),
            "route_plan": len(quote.get("routePlan", [])),
        }

    except Exception as e:
        logger.exception(f"Quote failed: {e}")
        return {
            "status": "error",
            "error": str(e),
        }


def main():
    """Run the MCP server."""
    logger.info("Starting transaction-executor MCP server...")
    mcp.run()


if __name__ == "__main__":
    main()
