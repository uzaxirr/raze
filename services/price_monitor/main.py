#!/usr/bin/env python3
"""
Standalone price monitoring service.
Checks cryptocurrency prices and sends Telegram notifications when alert conditions are met.

Usage:
    python main.py
"""
import asyncio
import logging
import os
import signal
import sys
from pathlib import Path

from dotenv import load_dotenv

# Load from project root
_root = Path(__file__).resolve().parent
while not (_root / '.env').exists() and _root != _root.parent:
    _root = _root.parent
load_dotenv(_root / '.env')

# Add parent paths for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from monitor import PriceMonitor
from notifier import TelegramNotifier

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def get_required_env(key: str) -> str:
    """Get a required environment variable or exit."""
    value = os.getenv(key)
    if not value:
        logger.error(f"Missing required environment variable: {key}")
        sys.exit(1)
    return value


async def main():
    """Main entry point."""
    # Get required config
    telegram_token = get_required_env("TELEGRAM_BOT_TOKEN")
    birdeye_key = os.getenv("BIRDEYE_API_KEY")

    if not birdeye_key:
        logger.warning("BIRDEYE_API_KEY not set - price fetching will fail")

    # Initialize components
    notifier = TelegramNotifier(bot_token=telegram_token)
    monitor = PriceMonitor(notifier=notifier)

    # Handle shutdown signals
    loop = asyncio.get_event_loop()

    def shutdown_handler():
        logger.info("Shutdown signal received")
        monitor.stop()

    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, shutdown_handler)

    logger.info("=" * 50)
    logger.info("Price Monitor Service Starting")
    logger.info("=" * 50)

    # Run the monitor
    await monitor.run()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
