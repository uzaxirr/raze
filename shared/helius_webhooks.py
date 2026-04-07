"""
Helius Webhooks API client.
Manages webhook creation and address updates for wallet transaction monitoring.
"""
import os
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any
import httpx
from dotenv import load_dotenv

# Load from project root
_root = Path(__file__).resolve().parent
while not (_root / '.env').exists() and _root != _root.parent:
    _root = _root.parent
load_dotenv(_root / '.env')

logger = logging.getLogger(__name__)

HELIUS_API_KEY = os.getenv('HELIUS_API_KEY')
HELIUS_BASE_URL = 'https://api-mainnet.helius-rpc.com/v0'
TIMEOUT = 30


async def create_webhook(
    webhook_url: str,
    auth_header: Optional[str] = None
) -> Optional[str]:
    """
    Create a new Helius webhook.

    Args:
        webhook_url: URL to receive webhook notifications
        auth_header: Optional auth header for webhook requests

    Returns:
        Webhook ID if successful, None otherwise
    """
    if not HELIUS_API_KEY:
        logger.error("HELIUS_API_KEY not set")
        return None

    payload = {
        "webhookURL": webhook_url,
        "transactionTypes": ["ANY"],
        "accountAddresses": [],
        "webhookType": "enhanced"
    }

    if auth_header:
        payload["authHeader"] = auth_header

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{HELIUS_BASE_URL}/webhooks",
                params={"api-key": HELIUS_API_KEY},
                json=payload,
                timeout=TIMEOUT
            )

            if response.status_code == 200:
                data = response.json()
                webhook_id = data.get("webhookID")
                logger.info(f"Created Helius webhook: {webhook_id}")
                return webhook_id
            else:
                logger.error(f"Failed to create webhook: {response.status_code} - {response.text}")
                return None
    except Exception as e:
        logger.error(f"Error creating webhook: {e}")
        return None


async def get_webhook(webhook_id: str) -> Optional[Dict[str, Any]]:
    """
    Get details of a specific webhook.

    Args:
        webhook_id: The webhook ID

    Returns:
        Webhook details dict or None if not found
    """
    if not HELIUS_API_KEY:
        logger.error("HELIUS_API_KEY not set")
        return None

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{HELIUS_BASE_URL}/webhooks/{webhook_id}",
                params={"api-key": HELIUS_API_KEY},
                timeout=TIMEOUT
            )

            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Failed to get webhook: {response.status_code}")
                return None
    except Exception as e:
        logger.error(f"Error getting webhook: {e}")
        return None


async def get_all_webhooks() -> List[Dict[str, Any]]:
    """
    Get all webhooks for this API key.

    Returns:
        List of webhook details
    """
    if not HELIUS_API_KEY:
        logger.error("HELIUS_API_KEY not set")
        return []

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{HELIUS_BASE_URL}/webhooks",
                params={"api-key": HELIUS_API_KEY},
                timeout=TIMEOUT
            )

            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Failed to get webhooks: {response.status_code}")
                return []
    except Exception as e:
        logger.error(f"Error getting webhooks: {e}")
        return []


async def update_webhook_addresses(
    webhook_id: str,
    addresses: List[str]
) -> bool:
    """
    Update the list of monitored addresses for a webhook.
    This replaces all addresses - use add/remove helpers for incremental updates.

    Args:
        webhook_id: The webhook ID
        addresses: Complete list of addresses to monitor

    Returns:
        True if successful
    """
    if not HELIUS_API_KEY:
        logger.error("HELIUS_API_KEY not set")
        return False

    try:
        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{HELIUS_BASE_URL}/webhooks/{webhook_id}",
                params={"api-key": HELIUS_API_KEY},
                json={"accountAddresses": addresses},
                timeout=TIMEOUT
            )

            if response.status_code == 200:
                logger.info(f"Updated webhook {webhook_id} with {len(addresses)} addresses")
                return True
            else:
                logger.error(f"Failed to update webhook: {response.status_code} - {response.text}")
                return False
    except Exception as e:
        logger.error(f"Error updating webhook: {e}")
        return False


async def add_address_to_webhook(webhook_id: str, address: str) -> bool:
    """
    Add a single address to the webhook's monitored addresses.

    Args:
        webhook_id: The webhook ID
        address: Wallet address to add

    Returns:
        True if successful
    """
    # Get current addresses
    webhook = await get_webhook(webhook_id)
    if not webhook:
        logger.error(f"Could not fetch webhook {webhook_id}")
        return False

    current_addresses = webhook.get("accountAddresses", [])

    # Check if already monitoring
    if address in current_addresses:
        logger.info(f"Address {address[:8]}... already in webhook")
        return True

    # Add new address
    new_addresses = current_addresses + [address]
    return await update_webhook_addresses(webhook_id, new_addresses)


async def remove_address_from_webhook(webhook_id: str, address: str) -> bool:
    """
    Remove a single address from the webhook's monitored addresses.

    Args:
        webhook_id: The webhook ID
        address: Wallet address to remove

    Returns:
        True if successful
    """
    # Get current addresses
    webhook = await get_webhook(webhook_id)
    if not webhook:
        logger.error(f"Could not fetch webhook {webhook_id}")
        return False

    current_addresses = webhook.get("accountAddresses", [])

    # Check if address exists
    if address not in current_addresses:
        logger.info(f"Address {address[:8]}... not in webhook")
        return True

    # Remove address
    new_addresses = [a for a in current_addresses if a != address]
    return await update_webhook_addresses(webhook_id, new_addresses)


async def delete_webhook(webhook_id: str) -> bool:
    """
    Delete a webhook.

    Args:
        webhook_id: The webhook ID

    Returns:
        True if successful
    """
    if not HELIUS_API_KEY:
        logger.error("HELIUS_API_KEY not set")
        return False

    try:
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{HELIUS_BASE_URL}/webhooks/{webhook_id}",
                params={"api-key": HELIUS_API_KEY},
                timeout=TIMEOUT
            )

            if response.status_code == 200:
                logger.info(f"Deleted webhook {webhook_id}")
                return True
            else:
                logger.error(f"Failed to delete webhook: {response.status_code}")
                return False
    except Exception as e:
        logger.error(f"Error deleting webhook: {e}")
        return False
