"""Configuration management for Telegram Bot."""

import os
from pathlib import Path

from dotenv import load_dotenv

# Load the tg-bot's own .env file, NOT the repo-root .env.
# Walking the directory tree for any .env used to pick up backend/.env when the
# bot's own .env was missing — and because load_dotenv doesn't override existing
# env vars by default, a stale TELEGRAM_BOT_TOKEN in the parent shell could shadow
# the tg-bot value and make the bot poll the wrong token (→ Conflict errors).
_tg_bot_dir = Path(__file__).resolve().parent.parent  # .../backend/tg-bot
load_dotenv(_tg_bot_dir / '.env', override=True)


class Config:
    """Configuration class for Telegram Bot."""

    # Required
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")

    # AgentOS
    AGENTOS_BASE_URL: str = os.getenv("AGENTOS_BASE_URL", "http://localhost:7777")

    # Rate limiting
    MESSAGE_UPDATE_INTERVAL: float = float(
        os.getenv("MESSAGE_UPDATE_INTERVAL", "1.5")
    )
    MAX_MESSAGE_LENGTH: int = int(os.getenv("MAX_MESSAGE_LENGTH", "4096"))

    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # Privy API (for wallet creation)
    PRIVY_APP_ID: str = os.getenv("PRIVY_APP_ID", "")
    PRIVY_APP_SECRET: str = os.getenv("PRIVY_APP_SECRET", "")

    # Solana network (mainnet or devnet)
    SOLANA_NETWORK: str = os.getenv("SOLANA_NETWORK", "mainnet")

    @classmethod
    def validate(cls) -> list[str]:
        """Validate required configuration. Returns list of missing keys."""
        missing = []
        if not cls.TELEGRAM_BOT_TOKEN:
            missing.append("TELEGRAM_BOT_TOKEN")
        return missing


config = Config()
