"""Configuration management for Telegram Bot."""

import os
from pathlib import Path

from dotenv import load_dotenv

# Load from project root
_root = Path(__file__).resolve().parent
while not (_root / '.env').exists() and _root != _root.parent:
    _root = _root.parent
load_dotenv(_root / '.env')


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
