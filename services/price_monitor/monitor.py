"""
Price monitoring service.
Checks token prices against user alerts and sends notifications.
"""
import asyncio
import logging
import os
import sys
from datetime import datetime
from decimal import Decimal
from typing import Optional

# Add parent paths for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from db.database import SessionLocal
from db.models import PriceAlert
from shared.birdeye import get_multi_token_prices

from notifier import TelegramNotifier

logger = logging.getLogger(__name__)

# Check interval in seconds
CHECK_INTERVAL = 60


class PriceMonitor:
    """Background price monitoring service."""

    def __init__(self, notifier: TelegramNotifier):
        self.notifier = notifier
        self._running = False

    async def run(self):
        """Run the price monitoring loop."""
        self._running = True
        logger.info(f"Price monitor started (checking every {CHECK_INTERVAL} seconds)")

        # Initial delay
        await asyncio.sleep(5)

        while self._running:
            try:
                await self._check_alerts()
            except Exception as e:
                logger.error(f"Error in price monitor loop: {e}", exc_info=True)

            await asyncio.sleep(CHECK_INTERVAL)

    def stop(self):
        """Stop the monitoring loop."""
        self._running = False
        logger.info("Price monitor stopped")

    async def _check_alerts(self):
        """Check all active alerts against current prices."""
        db = SessionLocal()
        try:
            # Get all active alerts
            active_alerts = db.query(PriceAlert).filter_by(is_active=True).all()

            if not active_alerts:
                return

            logger.info(f"Checking {len(active_alerts)} active alert(s)")

            # Get unique token addresses
            token_addresses = list(set(a.token_address for a in active_alerts))

            # Fetch prices in batch
            prices = await get_multi_token_prices(token_addresses)

            # Log fetched prices
            for addr, price in prices.items():
                if price is not None:
                    logger.info(f"Fetched price for {addr[:8]}...: ${price}")

            # Check each alert
            triggered_alerts = []
            for alert in active_alerts:
                current_price = prices.get(alert.token_address)

                if current_price is None:
                    logger.warning(f"No price available for {alert.token_symbol} ({alert.token_address[:8]}...)")
                    continue

                target = alert.target_price
                triggered = False

                if alert.condition == 'above' and current_price >= target:
                    triggered = True
                elif alert.condition == 'below' and current_price <= target:
                    triggered = True

                if triggered:
                    logger.info(f"TRIGGERED: {alert.token_symbol} {alert.condition} ${target} (current: ${current_price})")
                    triggered_alerts.append((alert, current_price))
                else:
                    logger.info(f"Not triggered: {alert.token_symbol} {alert.condition} ${target} (current: ${current_price})")

            # Process triggered alerts
            for alert, current_price in triggered_alerts:
                try:
                    # Send notification
                    success = await self.notifier.send_price_alert(
                        user_id=alert.user_id,
                        token_symbol=alert.token_symbol,
                        condition=alert.condition,
                        target_price=alert.target_price,
                        current_price=current_price,
                    )

                    if success:
                        # Mark alert as triggered (one-time)
                        alert.is_active = False
                        alert.triggered_at = datetime.utcnow()
                        alert.triggered_price = current_price

                        logger.info(
                            f"Alert triggered and notification sent: user={alert.user_id}, "
                            f"token={alert.token_symbol}, price={current_price}"
                        )
                except Exception as e:
                    logger.error(f"Error processing alert {alert.id}: {e}")

            if triggered_alerts:
                db.commit()

        finally:
            db.close()
