"""Telegram notification sender."""
import logging
from decimal import Decimal
from telegram import Bot

logger = logging.getLogger(__name__)


class TelegramNotifier:
    """Sends notifications to Telegram users."""

    def __init__(self, bot_token: str):
        self.bot = Bot(token=bot_token)

    async def send_price_alert(
        self,
        user_id: int,
        token_symbol: str,
        condition: str,
        target_price: Decimal,
        current_price: Decimal,
    ) -> bool:
        """Send a price alert notification.

        Args:
            user_id: Telegram user ID
            token_symbol: Token symbol (e.g., "SOL")
            condition: Alert condition ("above" or "below")
            target_price: Target price threshold
            current_price: Current price that triggered the alert

        Returns:
            True if sent successfully, False otherwise
        """
        direction = "rose above" if condition == 'above' else "dropped below"

        def format_price(p: Decimal) -> str:
            if p >= 1:
                return f"${p:,.4f}"
            elif p >= 0.0001:
                return f"${p:.6f}"
            else:
                return f"${p:.10f}"

        message = (
            f"🔔 Price Alert!\n\n"
            f"{token_symbol} just {direction} {format_price(target_price)}\n"
            f"Current: {format_price(current_price)}\n\n"
            f"(one-time alert deactivated)"
        )

        try:
            await self.bot.send_message(chat_id=user_id, text=message)
            logger.info(f"Sent price alert to user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to send alert to user {user_id}: {e}")
            return False

    async def send_message(self, user_id: int, message: str) -> bool:
        """Send a generic message to a user.

        Args:
            user_id: Telegram user ID
            message: Message text

        Returns:
            True if sent successfully, False otherwise
        """
        try:
            await self.bot.send_message(chat_id=user_id, text=message)
            return True
        except Exception as e:
            logger.error(f"Failed to send message to user {user_id}: {e}")
            return False
