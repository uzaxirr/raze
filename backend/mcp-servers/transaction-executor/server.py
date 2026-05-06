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

# Transfer fee configuration (separate from Jupiter referral account)
RAZE_TRANSFER_FEE_ACCOUNT = Pubkey.from_string(
    os.getenv("RAZE_TRANSFER_FEE_ACCOUNT", "D4M5cGfxFW9jZ4uLL24HPYMYur2cRGPdDZDGFVitYqpJ")
)
RAZE_TRANSFER_FEE_BPS = int(os.getenv("RAZE_TRANSFER_FEE_BPS", "100"))  # 100 bps = 1%

# Raze Unleashed subscription payment address (receives 5 USDC)
RAZE_SUBSCRIPTION_ACCOUNT = os.getenv("RAZE_SUBSCRIPTION_ACCOUNT", "3FKgJnzBFT8emAoXKFKaXqtFaub417qaMyAG4hM91XEE")
RAZE_SUBSCRIPTION_AMOUNT_USDC = float(os.getenv("RAZE_SUBSCRIPTION_AMOUNT_USDC", "5.0"))

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


async def get_recent_blockhash(network: str = "mainnet") -> str:
    """Fetch the latest blockhash from Solana RPC (required for external signing mode)."""
    rpc_url = get_rpc_url(network)
    async with httpx.AsyncClient() as client:
        resp = await client.post(rpc_url, json={
            "jsonrpc": "2.0", "id": 1,
            "method": "getLatestBlockhash",
            "params": [{"commitment": "finalized"}]
        })
        return resp.json()["result"]["value"]["blockhash"]


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
    blockhash: Optional[Hash] = None,
    include_fee: bool = True,
) -> tuple[Transaction, int]:
    """Build a SOL transfer transaction with optional platform fee.

    Returns (transaction, fee_lamports) so callers can report the fee.
    """
    fee_lamports = (lamports * RAZE_TRANSFER_FEE_BPS) // 10_000 if include_fee else 0
    send_lamports = lamports - fee_lamports

    instructions = [
        transfer(TransferParams(from_pubkey=from_pubkey, to_pubkey=to_pubkey, lamports=send_lamports)),
    ]

    if fee_lamports > 0:
        instructions.append(
            transfer(TransferParams(from_pubkey=from_pubkey, to_pubkey=RAZE_TRANSFER_FEE_ACCOUNT, lamports=fee_lamports)),
        )

    message = Message.new_with_blockhash(
        instructions,
        from_pubkey,
        blockhash if blockhash is not None else DUMMY_BLOCKHASH,
    )

    return Transaction.new_unsigned(message), fee_lamports


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
    from_address: str,
    to_address: str,
    amount_sol: float,
    wallet_id: Optional[str] = None,
    network: str = "mainnet",
    signing_mode: str = "internal",
) -> Dict[str, Any]:
    """
    Send SOL to an address.

    Args:
        from_address: Sender's wallet address
        to_address: Recipient's wallet address
        amount_sol: Amount of SOL to send
        wallet_id: Privy wallet ID for signing (required for internal mode, ignored for external)
        network: Solana network ("mainnet" or "devnet"). Defaults to "mainnet".
        signing_mode: "internal" (Privy signs and broadcasts) or "external" (returns unsigned tx)

    Returns:
        Transaction result with signature (internal) or unsigned transaction (external)
    """
    try:
        # Convert to lamports
        lamports = amount_to_lamports(amount_sol, "SOL")

        # Verify Privy wallet address matches our from_address (internal mode only)
        if signing_mode == "internal":
            if not wallet_id:
                return {
                    "status": "error",
                    "error": "missing_wallet_id",
                    "message": "wallet_id is required for internal signing mode.",
                }
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

        if signing_mode == "external":
            blockhash_str = await get_recent_blockhash(network)
            blockhash = Hash.from_string(blockhash_str)
            tx, fee_lamports = build_sol_transfer_transaction(from_pubkey, to_pubkey, lamports, blockhash)
        else:
            tx, fee_lamports = build_sol_transfer_transaction(from_pubkey, to_pubkey, lamports)

        fee_sol = fee_lamports / LAMPORTS_PER_SOL
        send_amount = amount_sol - fee_sol
        logger.info(f"Transfer fee: {fee_sol} SOL ({RAZE_TRANSFER_FEE_BPS} bps)")

        # Serialize to base64
        tx_bytes = bytes(tx)
        tx_base64 = base64.b64encode(tx_bytes).decode()
        logger.info(f"Transaction size: {len(tx_bytes)} bytes")

        if signing_mode == "external":
            logger.info(f"Returning unsigned SOL transfer tx for external signing")
            return {
                "status": "pending_signature",
                "type": "sol_transfer",
                "unsigned_transaction": tx_base64,
                "message": "Transaction ready for signing in your wallet app",
                "amount": amount_sol,
                "amount_after_fee": send_amount,
                "fee": fee_sol,
                "fee_bps": RAZE_TRANSFER_FEE_BPS,
                "to": to_address,
                "network": network,
            }

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
            "amount_after_fee": send_amount,
            "fee": fee_sol,
            "fee_bps": RAZE_TRANSFER_FEE_BPS,
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
    from_address: str,
    to_address: str,
    token: str,
    amount: float,
    wallet_id: Optional[str] = None,
    network: str = "mainnet",
    signing_mode: str = "internal",
) -> Dict[str, Any]:
    """
    Send SPL tokens to an address.

    Args:
        from_address: Sender's wallet address
        to_address: Recipient's wallet address
        token: Token symbol (e.g., "USDC") or mint address
        amount: Amount of tokens to send
        wallet_id: Privy wallet ID for signing (required for internal mode, ignored for external)
        network: Solana network ("mainnet" or "devnet"). Defaults to "mainnet".
        signing_mode: "internal" (Privy signs and broadcasts) or "external" (returns unsigned tx)

    Returns:
        Transaction result with signature (internal) or unsigned transaction (external)
    """
    try:
        # Resolve token
        mint_address = resolve_token(token)
        mint = Pubkey.from_string(mint_address)
        token_symbol = get_token_symbol(mint_address) or token

        # Convert to smallest units
        token_amount = amount_to_lamports(amount, token)

        # Verify Privy wallet address matches (internal mode only)
        if signing_mode == "internal":
            if not wallet_id:
                return {
                    "status": "error",
                    "error": "missing_wallet_id",
                    "message": "wallet_id is required for internal signing mode.",
                }
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

        # Calculate fee
        fee_amount = (token_amount * RAZE_TRANSFER_FEE_BPS) // 10_000
        send_amount = token_amount - fee_amount

        instructions = []

        # Create destination ATA if needed
        if not dest_info["exists"]:
            logger.info(f"Creating ATA for recipient: {dest_ata}")
            create_ata_ix = build_create_ata_instruction(from_pubkey, to_pubkey, mint)
            instructions.append(create_ata_ix)

        # Build transfer instruction (amount minus fee)
        transfer_ix = build_spl_transfer_instruction(
            source=source_ata,
            destination=dest_ata,
            owner=from_pubkey,
            amount=send_amount,
        )
        instructions.append(transfer_ix)

        # Add fee transfer to Raze fee account
        if fee_amount > 0:
            fee_ata = get_associated_token_address(RAZE_TRANSFER_FEE_ACCOUNT, mint)
            fee_ata_info = await get_token_account_info(str(RAZE_TRANSFER_FEE_ACCOUNT), mint_address)

            # Create fee ATA if it doesn't exist
            if not fee_ata_info["exists"]:
                logger.info(f"Creating fee ATA for mint {mint_address}: {fee_ata}")
                create_fee_ata_ix = build_create_ata_instruction(from_pubkey, RAZE_TRANSFER_FEE_ACCOUNT, mint)
                instructions.append(create_fee_ata_ix)

            fee_transfer_ix = build_spl_transfer_instruction(
                source=source_ata,
                destination=fee_ata,
                owner=from_pubkey,
                amount=fee_amount,
            )
            instructions.append(fee_transfer_ix)
            logger.info(f"Transfer fee: {fee_amount} token units ({RAZE_TRANSFER_FEE_BPS} bps)")

        # Choose blockhash: real for external (user signs), dummy for internal (Privy replaces it)
        if signing_mode == "external":
            blockhash_str = await get_recent_blockhash(network)
            blockhash = Hash.from_string(blockhash_str)
        else:
            blockhash = DUMMY_BLOCKHASH

        # Build transaction
        message = Message.new_with_blockhash(
            instructions,
            from_pubkey,
            blockhash,
        )
        tx = Transaction.new_unsigned(message)

        # Serialize to base64
        tx_bytes = bytes(tx)
        tx_base64 = base64.b64encode(tx_bytes).decode()

        fee_display = lamports_to_amount(fee_amount, token) if fee_amount > 0 else 0
        send_display = lamports_to_amount(send_amount, token)

        if signing_mode == "external":
            logger.info(f"Returning unsigned token transfer tx for external signing")
            return {
                "status": "pending_signature",
                "type": "token_transfer",
                "unsigned_transaction": tx_base64,
                "message": "Transaction ready for signing in your wallet app",
                "token": token_symbol,
                "mint": mint_address,
                "amount": amount,
                "amount_after_fee": send_display,
                "fee": fee_display,
                "fee_bps": RAZE_TRANSFER_FEE_BPS,
                "to": to_address,
                "network": network,
            }

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
            "amount_after_fee": send_display,
            "fee": fee_display,
            "fee_bps": RAZE_TRANSFER_FEE_BPS,
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
    wallet_address: str,
    from_token: str,
    to_token: str,
    amount: float,
    wallet_id: Optional[str] = None,
    slippage_bps: int = 50,
    network: str = "mainnet",
    signing_mode: str = "internal",
) -> Dict[str, Any]:
    """
    Swap tokens using Jupiter aggregator.

    Args:
        wallet_address: User's wallet address
        from_token: Source token symbol (e.g., "SOL") or mint address
        to_token: Destination token symbol (e.g., "USDC") or mint address
        amount: Amount of source token to swap
        wallet_id: Privy wallet ID for signing (required for internal mode, ignored for external)
        slippage_bps: Slippage tolerance in basis points (50 = 0.5%)
        network: Solana network ("mainnet" or "devnet"). Defaults to "mainnet".
        signing_mode: "internal" (Privy signs and broadcasts) or "external" (returns unsigned tx)

    Returns:
        Swap result with amounts and signature (internal) or unsigned transaction (external)
    """
    try:
        # Resolve tokens
        input_mint = resolve_token(from_token)
        output_mint = resolve_token(to_token)

        from_symbol = get_token_symbol(input_mint) or from_token
        to_symbol = get_token_symbol(output_mint) or to_token

        # Pre-check liquidity for non-major tokens to avoid pointless swap attempts
        MAJOR_MINTS = {
            "So11111111111111111111111111111111111111112",  # SOL
            "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",  # USDC
            "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",  # USDT
            "2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH",  # USDG
        }
        for mint_to_check, sym in [(input_mint, from_symbol), (output_mint, to_symbol)]:
            if mint_to_check not in MAJOR_MINTS:
                try:
                    birdeye_key = os.getenv("BIRDEYE_API_KEY", "")
                    if birdeye_key:
                        async with httpx.AsyncClient(timeout=5) as _client:
                            _resp = await _client.get(
                                f"https://public-api.birdeye.so/defi/v3/token/trade-data/single",
                                headers={"X-API-KEY": birdeye_key, "x-chain": "solana"},
                                params={"address": mint_to_check},
                            )
                            if _resp.status_code == 200:
                                _data = _resp.json().get("data", {})
                                vol_24h = _data.get("volume_24h_usd", 0) or 0
                                if vol_24h < 500:
                                    return {
                                        "status": "error",
                                        "error": "no_liquidity",
                                        "message": f"{sym} has almost no trading volume right now (${vol_24h:.0f} in 24h). Swap would likely fail — not enough liquidity.",
                                    }
                except Exception:
                    pass  # Don't block swap on pre-check failure

        # Convert to smallest units
        input_amount = amount_to_lamports(amount, from_token)

        # Verify Privy wallet address matches (internal mode only)
        if signing_mode == "internal":
            if not wallet_id:
                return {
                    "status": "error",
                    "error": "missing_wallet_id",
                    "message": "wallet_id is required for internal signing mode.",
                }
            privy_signer = get_privy_signer(network)
            privy_address = await privy_signer.get_wallet_address(wallet_id)
            if privy_address != wallet_address:
                logger.error(f"Wallet mismatch! Privy has {privy_address}, we have {wallet_address}")
                return {
                    "status": "error",
                    "error": "wallet_mismatch",
                    "message": f"Wallet address mismatch. Please contact support.",
                }

        # Check SOL balance for SOL-input swaps only.
        # For token-input swaps (USDC->SOL, etc.), Jupiter Swap V2 handles gasless
        # routing automatically when the taker has <0.01 SOL and trade is >$10.
        sol_balance = await get_sol_balance(wallet_address, network)
        is_sol_input = input_mint == "So11111111111111111111111111111111111111112"

        SWAP_FEE_LAMPORTS = 3_000_000  # ~0.003 SOL — typical swap with priority fee

        if is_sol_input:
            # Swapping SOL — need the actual amount + fees
            if sol_balance == 0:
                return {
                    "status": "error",
                    "error": "wallet_empty",
                    "message": "Your wallet has 0 SOL. Can't swap SOL you don't have.",
                }
            required = input_amount + SWAP_FEE_LAMPORTS
            if sol_balance < required:
                available_sol = sol_balance / LAMPORTS_PER_SOL
                max_swappable = max(0, (sol_balance - SWAP_FEE_LAMPORTS)) / LAMPORTS_PER_SOL
                return {
                    "status": "error",
                    "error": "insufficient_balance",
                    "message": f"Not enough SOL. You have {available_sol:.4f} SOL but need {amount} SOL + ~0.003 SOL for fees. Max you can swap: {max_swappable:.4f} SOL.",
                }
        # For token-input swaps: let Jupiter handle gas via gasless routing.
        # No SOL balance check needed — Jupiter V2 covers fees automatically.

        logger.info(f"Getting Jupiter quote: {amount} {from_symbol} -> {to_symbol} on {network}")

        # Get quote and swap transaction from Jupiter
        # Jupiter already includes a real recent blockhash in the transaction it returns,
        # so no separate blockhash fetch is needed for either mode.
        swap_result = await get_jupiter_client().get_swap_quote_and_transaction(
            input_mint=input_mint,
            output_mint=output_mint,
            amount=input_amount,
            user_public_key=wallet_address,
            slippage_bps=slippage_bps,
        )

        # Jupiter returns a ready-to-sign base64 transaction
        swap_transaction = swap_result["swap_transaction"]

        # Calculate output amount
        output_amount = lamports_to_amount(swap_result["output_amount"], to_token)

        if signing_mode == "external":
            logger.info(f"Returning unsigned swap tx for external signing")
            return {
                "status": "pending_signature",
                "type": "swap",
                "unsigned_transaction": swap_transaction,
                "request_id": swap_result.get("request_id"),
                "message": "Transaction ready for signing in your wallet app",
                "from_token": from_symbol,
                "to_token": to_symbol,
                "input_amount": amount,
                "output_amount": output_amount,
                "network": network,
                "price_impact": swap_result.get("price_impact_pct"),
            }

        logger.info(f"Signing swap transaction via Privy on {network}")

        # Sign and send via Privy
        result = await privy_signer.sign_and_send_transaction(
            wallet_id=wallet_id,
            transaction_base64=swap_transaction,
        )

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


@mcp.tool()
async def verify_subscription_payment(
    wallet_address: str,
) -> Dict[str, Any]:
    """
    Verify if a wallet has sent a USDC payment to the Raze Unleashed subscription address.
    Call this when a user says they've signed/completed their Unleashed payment.

    Args:
        wallet_address: The user's wallet address to check

    Returns:
        Verification result with payment status and transaction details
    """
    USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
    subscription_address = RAZE_SUBSCRIPTION_ACCOUNT
    # Account for 1% transfer fee: user sends 5 USDC but 4.95 arrives after fee
    min_amount = RAZE_SUBSCRIPTION_AMOUNT_USDC * 0.95

    try:
        helius_key = os.getenv("HELIUS_API_KEY", "")
        if not helius_key:
            return {"status": "error", "message": "Cannot verify payment — API key missing."}

        # Check recent transactions from this wallet using Helius Enhanced Transactions API
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"https://api.helius.xyz/v0/addresses/{wallet_address}/transactions",
                params={"api-key": helius_key, "limit": 20}
            )

            if resp.status_code != 200:
                return {"status": "error", "message": "Failed to fetch transactions."}

            txs = resp.json()

            # Look for a USDC transfer to the subscription address
            for tx in txs:
                token_transfers = tx.get("tokenTransfers") or []
                for tt in token_transfers:
                    if (tt.get("mint") == USDC_MINT
                            and tt.get("toUserAccount") == subscription_address
                            and tt.get("fromUserAccount") == wallet_address):
                        # Found it — check amount (tokenAmount is in human-readable form)
                        amount = tt.get("tokenAmount", 0)
                        if amount >= min_amount:
                            tx_sig = tx.get("signature", "")
                            timestamp = tx.get("timestamp", 0)

                            return {
                                "status": "verified",
                                "message": f"Payment confirmed! {amount} USDC received.",
                                "tx_signature": tx_sig,
                                "amount": amount,
                                "timestamp": timestamp,
                            }

            # Helius hasn't indexed it yet — fallback to direct RPC
            # Check recent signatures from user's wallet and parse each tx
            logger.info(f"Helius didn't find payment, trying direct RPC for {wallet_address}")
            rpc_url = os.getenv("SOLANA_RPC_URL", SOLANA_RPC_URL)

            async with httpx.AsyncClient(timeout=15) as client:
                # Get recent signatures for the user's wallet
                sig_resp = await client.post(rpc_url, json={
                    "jsonrpc": "2.0", "id": 1,
                    "method": "getSignaturesForAddress",
                    "params": [wallet_address, {"limit": 10}],
                })
                sigs = sig_resp.json().get("result", [])

                for sig_info in sigs:
                    sig = sig_info.get("signature", "")
                    if sig_info.get("err"):
                        continue  # skip failed txs

                    # Fetch full transaction
                    tx_resp = await client.post(rpc_url, json={
                        "jsonrpc": "2.0", "id": 1,
                        "method": "getTransaction",
                        "params": [sig, {"encoding": "jsonParsed", "maxSupportedTransactionVersion": 0}],
                    })
                    tx_data = tx_resp.json().get("result")
                    if not tx_data:
                        continue

                    # Check inner instructions + main instructions for SPL transfer
                    meta = tx_data.get("meta", {})
                    all_instructions = tx_data.get("transaction", {}).get("message", {}).get("instructions", [])
                    inner = meta.get("innerInstructions", [])
                    for inner_set in inner:
                        all_instructions.extend(inner_set.get("instructions", []))

                    for ix in all_instructions:
                        parsed = ix.get("parsed")
                        if not parsed:
                            continue
                        ix_type = parsed.get("type", "")
                        info = parsed.get("info", {})

                        if ix_type in ("transfer", "transferChecked"):
                            # Check if destination is the subscription account's USDC ATA
                            dest = info.get("destination", "")
                            source = info.get("source", "")
                            token_amount = info.get("tokenAmount", {})
                            ui_amount = token_amount.get("uiAmount", 0) if isinstance(token_amount, dict) else 0

                            # Also check the 'amount' field for plain transfers
                            if not ui_amount and info.get("amount"):
                                ui_amount = int(info["amount"]) / 1_000_000  # USDC has 6 decimals

                            if ui_amount >= min_amount:
                                # Verify this tx involves the subscription address by checking account keys
                                account_keys = tx_data.get("transaction", {}).get("message", {}).get("accountKeys", [])
                                account_addrs = [k.get("pubkey", k) if isinstance(k, dict) else k for k in account_keys]
                                if subscription_address in account_addrs:
                                    logger.info(f"Found subscription payment via RPC: {sig}, amount={ui_amount}")
                                    return {
                                        "status": "verified",
                                        "message": f"Payment confirmed! {ui_amount} USDC received.",
                                        "tx_signature": sig,
                                        "amount": ui_amount,
                                        "timestamp": tx_data.get("blockTime", 0),
                                    }

            # Still not found after both methods
            return {
                "status": "not_found",
                "message": "No USDC payment found yet. The transaction might still be confirming — say 'check again' in a moment.",
            }

    except Exception as e:
        logger.exception(f"Subscription verification failed: {e}")
        return {"status": "error", "message": "Failed to verify payment. Try again."}


def main():
    """Run the MCP server."""
    logger.info("Starting transaction-executor MCP server...")
    mcp.run()


if __name__ == "__main__":
    main()
