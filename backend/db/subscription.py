"""Subscription management — Raze Unleashed.

Global utilities for checking premium status and managing subscriptions.
Importable from any service: tg-bot, imessage-bot, AgentOS, MCP servers.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy import select
from db.database import SessionLocal
from db.models import Subscription


def is_unleashed(
    telegram_user_id: Optional[int] = None,
    phone_number: Optional[str] = None,
    email: Optional[str] = None,
) -> bool:
    """Check if a user has an active Raze Unleashed subscription.

    Pass whichever identifier you have — works from any channel.
    """
    with SessionLocal() as db:
        q = select(Subscription).where(
            Subscription.tier == "unleashed",
            Subscription.status == "active",
            Subscription.current_period_end > datetime.now(timezone.utc),
        )
        if telegram_user_id:
            q = q.where(Subscription.telegram_user_id == telegram_user_id)
        elif phone_number:
            q = q.where(Subscription.imessage_phone == phone_number)
        elif email:
            q = q.where(Subscription.email == email)
        else:
            return False
        return db.execute(q).first() is not None


def activate_unleashed(
    telegram_user_id: Optional[int] = None,
    phone_number: Optional[str] = None,
    email: Optional[str] = None,
    payment_method: str = "onchain_usdc",
    tx_hash: Optional[str] = None,
    stripe_customer_id: Optional[str] = None,
    stripe_subscription_id: Optional[str] = None,
    days: int = 30,
) -> Subscription:
    """Activate or extend a Raze Unleashed subscription.

    Also approves the user on the waitlist (bypasses waitlist)
    and sets signing_mode to 'internal' (auto-sign via Privy wallet).
    """
    now = datetime.now(timezone.utc)

    # Approve on waitlist if they're waiting
    if telegram_user_id:
        try:
            from db.models import Waitlist, UserProfile
            with SessionLocal() as wl_db:
                entry = wl_db.query(Waitlist).filter_by(telegram_user_id=telegram_user_id).first()
                if entry and entry.status not in ("approved", "active"):
                    entry.status = "approved"
                    entry.approved_at = now
                wl_db.commit()

                # Set signing mode to internal (Privy auto-sign) for Unleashed users
                profile = wl_db.query(UserProfile).filter_by(telegram_user_id=telegram_user_id).first()
                if profile:
                    profile.signing_mode = "internal"
                    wl_db.commit()
        except Exception:
            pass  # Don't block subscription on waitlist/profile update failure

    with SessionLocal() as db:
        # Find existing subscription
        sub = None
        if telegram_user_id:
            sub = db.query(Subscription).filter(
                Subscription.telegram_user_id == telegram_user_id
            ).first()
        elif phone_number:
            sub = db.query(Subscription).filter(
                Subscription.imessage_phone == phone_number
            ).first()
        elif email:
            sub = db.query(Subscription).filter(
                Subscription.email == email
            ).first()

        if sub:
            # Extend existing — if still active, extend from current end date
            if sub.current_period_end and sub.current_period_end > now:
                sub.current_period_end = sub.current_period_end + timedelta(days=days)
            else:
                sub.current_period_start = now
                sub.current_period_end = now + timedelta(days=days)
            sub.tier = "unleashed"
            sub.status = "active"
            sub.payment_method = payment_method
            if tx_hash:
                sub.onchain_tx_hash = tx_hash
            if stripe_customer_id:
                sub.stripe_customer_id = stripe_customer_id
            if stripe_subscription_id:
                sub.stripe_subscription_id = stripe_subscription_id
        else:
            # Create new
            sub = Subscription(
                telegram_user_id=telegram_user_id,
                imessage_phone=phone_number,
                email=email,
                tier="unleashed",
                status="active",
                payment_method=payment_method,
                onchain_tx_hash=tx_hash,
                stripe_customer_id=stripe_customer_id,
                stripe_subscription_id=stripe_subscription_id,
                current_period_start=now,
                current_period_end=now + timedelta(days=days),
            )
            db.add(sub)

        db.commit()
        db.refresh(sub)
        return sub


def get_subscription(
    telegram_user_id: Optional[int] = None,
    phone_number: Optional[str] = None,
) -> Optional[Subscription]:
    """Get a user's subscription record."""
    with SessionLocal() as db:
        q = select(Subscription)
        if telegram_user_id:
            q = q.where(Subscription.telegram_user_id == telegram_user_id)
        elif phone_number:
            q = q.where(Subscription.imessage_phone == phone_number)
        else:
            return None
        row = db.execute(q).first()
        return row[0] if row else None


def check_and_expire() -> int:
    """Mark expired subscriptions. Returns count of newly expired."""
    now = datetime.now(timezone.utc)
    with SessionLocal() as db:
        expired = db.query(Subscription).filter(
            Subscription.tier == "unleashed",
            Subscription.status == "active",
            Subscription.current_period_end < now,
        ).all()
        for sub in expired:
            sub.status = "expired"
            sub.tier = "free"
        db.commit()
        return len(expired)
