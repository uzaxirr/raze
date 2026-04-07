#!/usr/bin/env python3
"""
Setup script for Helius webhook.
Run this once after deploying the webhook receiver to create the master webhook.

Usage:
    python scripts/setup_helius_webhook.py https://your-webhook-receiver-url.com/webhook/helius
"""
import os
import sys
import asyncio
from pathlib import Path

# Load from project root
_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_root))

from dotenv import load_dotenv
load_dotenv(_root / '.env')

from db.database import SessionLocal
from db.models import HeliusWebhookConfig
from shared.helius_webhooks import create_webhook, get_all_webhooks


async def setup_webhook(webhook_url: str):
    """Create the master Helius webhook and store config in database."""
    print(f"Setting up Helius webhook for: {webhook_url}")

    # Check if webhook already exists
    db = SessionLocal()
    try:
        existing = db.query(HeliusWebhookConfig).first()
        if existing:
            print(f"Webhook already configured: {existing.webhook_id}")
            print(f"URL: {existing.webhook_url}")
            print("\nTo recreate, delete the existing config first.")
            return
    finally:
        db.close()

    # Check existing webhooks in Helius
    print("\nChecking existing Helius webhooks...")
    existing_webhooks = await get_all_webhooks()
    print(f"Found {len(existing_webhooks)} existing webhook(s)")

    # Create new webhook
    auth_header = os.getenv("HELIUS_WEBHOOK_AUTH_HEADER", "")
    print(f"\nCreating new webhook...")
    webhook_id = await create_webhook(webhook_url, auth_header if auth_header else None)

    if not webhook_id:
        print("ERROR: Failed to create webhook. Check your HELIUS_API_KEY.")
        sys.exit(1)

    print(f"Created webhook: {webhook_id}")

    # Store in database
    db = SessionLocal()
    try:
        config = HeliusWebhookConfig(
            webhook_id=webhook_id,
            webhook_url=webhook_url
        )
        db.add(config)
        db.commit()
        print(f"\nWebhook config stored in database.")
        print(f"\nSetup complete! Webhook ID: {webhook_id}")
    except Exception as e:
        db.rollback()
        print(f"ERROR: Failed to store config: {e}")
        sys.exit(1)
    finally:
        db.close()


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/setup_helius_webhook.py <webhook_url>")
        print("\nExample:")
        print("  python scripts/setup_helius_webhook.py https://webhook-receiver-xxx.up.railway.app/webhook/helius")
        sys.exit(1)

    webhook_url = sys.argv[1]

    if not webhook_url.startswith("http"):
        print("ERROR: webhook_url must start with http:// or https://")
        sys.exit(1)

    asyncio.run(setup_webhook(webhook_url))


if __name__ == "__main__":
    main()
