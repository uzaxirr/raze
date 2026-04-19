"""Waitlist management — CRUD, position calculation, access control."""
import secrets
import logging
from datetime import datetime, date

from db.database import SessionLocal
from db.models import Waitlist

logger = logging.getLogger(__name__)

# Config (overridable via env vars later)
REFERRAL_BOOST = 50       # spots gained per referral
AUTO_APPROVE_REFS = 5     # referrals needed for instant access
DAILY_MSG_LIMIT = 5       # messages/day for taste mode


def generate_referral_code() -> str:
    """Generate a unique 8-char referral code."""
    return secrets.token_urlsafe(6)  # gives ~8 chars


def get_waitlist_entry(telegram_user_id: int) -> Waitlist | None:
    """Get a user's waitlist entry."""
    db = SessionLocal()
    try:
        return db.query(Waitlist).filter_by(telegram_user_id=telegram_user_id).first()
    finally:
        db.close()


def get_by_referral_code(code: str) -> Waitlist | None:
    """Get a waitlist entry by referral code."""
    db = SessionLocal()
    try:
        return db.query(Waitlist).filter_by(referral_code=code).first()
    finally:
        db.close()


def get_waitlist_count() -> int:
    """Get total number of people on the waitlist."""
    db = SessionLocal()
    try:
        return db.query(Waitlist).count()
    finally:
        db.close()


def get_approved_count() -> int:
    """Get number of approved/active users."""
    db = SessionLocal()
    try:
        return db.query(Waitlist).filter(Waitlist.status.in_(["approved", "active"])).count()
    finally:
        db.close()


def join_waitlist(
    telegram_user_id: int,
    telegram_username: str | None = None,
    first_name: str | None = None,
    referred_by_code: str | None = None,
    joined_via: str = "direct",
) -> Waitlist:
    """Add a user to the waitlist. Idempotent — returns existing entry if already joined."""
    db = SessionLocal()
    try:
        # Check if already on waitlist
        existing = db.query(Waitlist).filter_by(telegram_user_id=telegram_user_id).first()
        if existing:
            return existing

        # Validate referral code
        referrer = None
        referred_by_user_id = None
        if referred_by_code:
            referrer = db.query(Waitlist).filter_by(referral_code=referred_by_code).first()
            if referrer:
                # Can't refer yourself
                if referrer.telegram_user_id == telegram_user_id:
                    referrer = None
                    referred_by_code = None
                else:
                    referred_by_user_id = referrer.telegram_user_id

        # Generate unique referral code
        code = generate_referral_code()
        while db.query(Waitlist).filter_by(referral_code=code).first():
            code = generate_referral_code()

        # Position = next in line
        total = db.query(Waitlist).count()
        position = total + 1

        entry = Waitlist(
            telegram_user_id=telegram_user_id,
            telegram_username=telegram_username,
            first_name=first_name,
            referral_code=code,
            referred_by_code=referred_by_code if referrer else None,
            referred_by_user_id=referred_by_user_id,
            position=position,
            joined_via=joined_via,
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)

        # Credit referrer
        if referrer:
            process_referral(referrer.telegram_user_id, db)

        logger.info(f"User {telegram_user_id} joined waitlist at position {position}")
        return entry
    finally:
        db.close()


def process_referral(referrer_user_id: int, db=None) -> dict | None:
    """Credit a referral to the referrer. Returns updated referrer info."""
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True

    try:
        referrer = db.query(Waitlist).filter_by(telegram_user_id=referrer_user_id).first()
        if not referrer:
            return None

        referrer.referral_count += 1
        old_position = referrer.position

        if referrer.referral_count >= AUTO_APPROVE_REFS and referrer.status == "waiting":
            # Auto-approve
            referrer.status = "approved"
            referrer.approved_at = datetime.utcnow()
            referrer.position = 0  # Top of the queue
            logger.info(f"User {referrer_user_id} auto-approved with {referrer.referral_count} referrals")
        else:
            # Bump up position
            new_position = max(1, referrer.position - REFERRAL_BOOST)
            referrer.position = new_position
            logger.info(f"User {referrer_user_id} moved from #{old_position} to #{new_position}")

        db.commit()
        return {
            "referral_count": referrer.referral_count,
            "old_position": old_position,
            "new_position": referrer.position,
            "auto_approved": referrer.status == "approved",
            "refs_remaining": max(0, AUTO_APPROVE_REFS - referrer.referral_count),
        }
    finally:
        if close_db:
            db.close()


def check_access(telegram_user_id: int) -> dict:
    """
    Check a user's access level.

    Returns:
        {"access": "full"}                    — approved/active user
        {"access": "taste", "remaining": N}   — waitlisted, has messages left
        {"access": "limited"}                 — waitlisted, daily limit hit
        {"access": "new"}                     — not on waitlist yet
        {"access": "banned"}                  — banned
    """
    db = SessionLocal()
    try:
        entry = db.query(Waitlist).filter_by(telegram_user_id=telegram_user_id).first()

        if entry is None:
            return {"access": "new"}

        if entry.status == "banned":
            return {"access": "banned"}

        if entry.status in ("approved", "active"):
            if entry.status == "approved":
                entry.status = "active"
                entry.activated_at = datetime.utcnow()
                db.commit()
            return {"access": "full"}

        # Status is "waiting" — check taste mode limits
        today = date.today()
        reset_date = entry.messages_reset_at.date() if entry.messages_reset_at else None

        if reset_date != today:
            # Reset daily counter
            entry.messages_today = 0
            entry.messages_reset_at = datetime.utcnow()
            db.commit()

        if entry.messages_today < DAILY_MSG_LIMIT:
            remaining = DAILY_MSG_LIMIT - entry.messages_today
            return {"access": "taste", "remaining": remaining, "entry": entry}
        else:
            return {"access": "limited", "entry": entry}
    finally:
        db.close()


def increment_message_count(telegram_user_id: int):
    """Increment the daily message counter for a waitlisted user."""
    db = SessionLocal()
    try:
        entry = db.query(Waitlist).filter_by(telegram_user_id=telegram_user_id).first()
        if entry:
            entry.messages_today += 1
            entry.last_seen_at = datetime.utcnow()
            db.commit()
    finally:
        db.close()


def set_email(telegram_user_id: int, email: str) -> bool:
    """Set the email for a waitlisted user."""
    db = SessionLocal()
    try:
        entry = db.query(Waitlist).filter_by(telegram_user_id=telegram_user_id).first()
        if entry:
            entry.email = email
            db.commit()
            return True
        return False
    finally:
        db.close()


def set_wallet_shared(telegram_user_id: int, wallet_address: str):
    """Record that a user shared their wallet address."""
    db = SessionLocal()
    try:
        entry = db.query(Waitlist).filter_by(telegram_user_id=telegram_user_id).first()
        if entry:
            entry.wallet_address_shared = wallet_address
            db.commit()
    finally:
        db.close()


def approve_user(telegram_user_id: int) -> bool:
    """Manually approve a user."""
    db = SessionLocal()
    try:
        entry = db.query(Waitlist).filter_by(telegram_user_id=telegram_user_id).first()
        if entry and entry.status == "waiting":
            entry.status = "approved"
            entry.approved_at = datetime.utcnow()
            db.commit()
            return True
        return False
    finally:
        db.close()


def approve_batch(count: int) -> list[int]:
    """Approve the top N users by position. Returns list of approved telegram_user_ids."""
    db = SessionLocal()
    try:
        entries = (
            db.query(Waitlist)
            .filter_by(status="waiting")
            .order_by(Waitlist.position.asc())
            .limit(count)
            .all()
        )
        approved_ids = []
        for entry in entries:
            entry.status = "approved"
            entry.approved_at = datetime.utcnow()
            approved_ids.append(entry.telegram_user_id)
        db.commit()
        return approved_ids
    finally:
        db.close()


def ban_user(telegram_user_id: int) -> bool:
    """Ban a user from the waitlist."""
    db = SessionLocal()
    try:
        entry = db.query(Waitlist).filter_by(telegram_user_id=telegram_user_id).first()
        if entry:
            entry.status = "banned"
            db.commit()
            return True
        return False
    finally:
        db.close()


def get_stats() -> dict:
    """Get waitlist statistics."""
    db = SessionLocal()
    try:
        total = db.query(Waitlist).count()
        waiting = db.query(Waitlist).filter_by(status="waiting").count()
        approved = db.query(Waitlist).filter_by(status="approved").count()
        active = db.query(Waitlist).filter_by(status="active").count()
        banned = db.query(Waitlist).filter_by(status="banned").count()
        today = date.today()
        today_joins = db.query(Waitlist).filter(
            Waitlist.created_at >= datetime.combine(today, datetime.min.time())
        ).count()

        # Top referrers
        top_referrers = (
            db.query(Waitlist)
            .filter(Waitlist.referral_count > 0)
            .order_by(Waitlist.referral_count.desc())
            .limit(10)
            .all()
        )

        return {
            "total": total,
            "waiting": waiting,
            "approved": approved,
            "active": active,
            "banned": banned,
            "today_joins": today_joins,
            "top_referrers": [
                {
                    "username": r.telegram_username,
                    "user_id": r.telegram_user_id,
                    "referrals": r.referral_count,
                    "position": r.position,
                    "status": r.status,
                }
                for r in top_referrers
            ],
        }
    finally:
        db.close()
