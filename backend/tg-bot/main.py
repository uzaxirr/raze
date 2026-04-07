#!/usr/bin/env python3
"""Telegram Bot for Solana MCP Agent - Main Entry Point."""

import logging
import sys

from src.bot import create_application
from src.config import config


def setup_logging() -> None:
    """Configure logging for the application."""
    logging.basicConfig(
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        level=getattr(logging, config.LOG_LEVEL.upper(), logging.INFO),
        handlers=[logging.StreamHandler(sys.stdout)],
    )

    # Reduce noise from httpx
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)


def main() -> None:
    """Main entry point."""
    setup_logging()
    logger = logging.getLogger(__name__)

    # Validate configuration
    missing = config.validate()
    if missing:
        logger.error(f"Missing required configuration: {', '.join(missing)}")
        logger.error("Please set TELEGRAM_BOT_TOKEN in your .env file")
        sys.exit(1)

    logger.info("Starting Telegram Bot for Solana MCP Agent")
    logger.info(f"AgentOS URL: {config.AGENTOS_BASE_URL}")

    # Create and run application
    app = create_application()

    logger.info("Bot is starting... Press Ctrl+C to stop.")
    app.run_polling(allowed_updates=["message", "callback_query"])


if __name__ == "__main__":
    main()
