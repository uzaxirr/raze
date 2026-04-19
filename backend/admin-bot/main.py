"""Raze Admin Bot — waitlist management, accessible only from admin Telegram ID."""
import os
import sys
import logging
from pathlib import Path

# Add parent directory to path for shared imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent / ".env", override=True)

from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

ADMIN_BOT_TOKEN = os.getenv("ADMIN_BOT_TOKEN")
ADMIN_USER_ID = int(os.getenv("ADMIN_USER_ID", "1327643512"))


def admin_only(func):
    """Decorator to restrict commands to admin user only."""
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE):
        if update.effective_user.id != ADMIN_USER_ID:
            return  # silently ignore non-admin
        return await func(update, context)
    return wrapper


@admin_only
async def stats_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show waitlist statistics."""
    from tg_bot_waitlist import get_stats
    stats = get_stats()

    top_referrers = "\n".join(
        f"  {i+1}. @{r['username'] or r['user_id']} — {r['referrals']} refs ({r['status']})"
        for i, r in enumerate(stats["top_referrers"][:10])
    ) or "  none yet"

    viral_coeff = f"{stats['total'] / max(1, stats['total'] - len([r for r in stats['top_referrers'] if r['referrals'] > 0])):.2f}" if stats["total"] > 0 else "0"

    await update.message.reply_text(
        f"📊 Waitlist Stats\n\n"
        f"Total: {stats['total']}\n"
        f"Waiting: {stats['waiting']}\n"
        f"Approved: {stats['approved']}\n"
        f"Active: {stats['active']}\n"
        f"Banned: {stats['banned']}\n"
        f"Today: {stats['today_joins']} new\n\n"
        f"🏆 Top Referrers:\n{top_referrers}"
    )


@admin_only
async def approve_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Approve users. Usage: /approve 50 or /approve @username"""
    if not context.args:
        await update.message.reply_text("usage: /approve 50 or /approve @username")
        return

    arg = context.args[0]

    if arg.startswith("@"):
        # Approve by username
        from db.database import SessionLocal
        from db.models import Waitlist
        username = arg[1:]
        db = SessionLocal()
        try:
            entry = db.query(Waitlist).filter_by(telegram_username=username).first()
            if not entry:
                await update.message.reply_text(f"user @{username} not found on waitlist")
                return
            if entry.status in ("approved", "active"):
                await update.message.reply_text(f"@{username} already approved")
                return
            from datetime import datetime
            entry.status = "approved"
            entry.approved_at = datetime.utcnow()
            db.commit()
            await update.message.reply_text(f"✅ @{username} approved (was #{entry.position})")

            # Notify the user via the main bot
            try:
                main_bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
                if main_bot_token:
                    from telegram import Bot
                    bot = Bot(token=main_bot_token)
                    await bot.send_message(
                        chat_id=entry.telegram_user_id,
                        text="you're in. welcome to raze 🫡\n\nsay anything to get started."
                    )
            except Exception as e:
                logger.warning(f"Failed to notify user: {e}")
        finally:
            db.close()
    else:
        # Approve batch
        try:
            count = int(arg)
        except ValueError:
            await update.message.reply_text("usage: /approve 50 or /approve @username")
            return

        from tg_bot_waitlist import approve_batch
        approved_ids = approve_batch(count)

        # Notify approved users via the main bot
        notified = 0
        main_bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
        if main_bot_token and approved_ids:
            from telegram import Bot
            bot = Bot(token=main_bot_token)
            for uid in approved_ids:
                try:
                    await bot.send_message(
                        chat_id=uid,
                        text="you're in. welcome to raze 🫡\n\nsay anything to get started."
                    )
                    notified += 1
                except Exception:
                    pass

        await update.message.reply_text(f"✅ Approved {len(approved_ids)} users, notified {notified}")


@admin_only
async def ban_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Ban a user. Usage: /ban @username"""
    if not context.args or not context.args[0].startswith("@"):
        await update.message.reply_text("usage: /ban @username")
        return

    username = context.args[0][1:]
    from db.database import SessionLocal
    from db.models import Waitlist
    db = SessionLocal()
    try:
        entry = db.query(Waitlist).filter_by(telegram_username=username).first()
        if not entry:
            await update.message.reply_text(f"@{username} not found")
            return
        entry.status = "banned"
        db.commit()
        await update.message.reply_text(f"🚫 @{username} banned")
    finally:
        db.close()


@admin_only
async def search_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Search a user. Usage: /search @username"""
    if not context.args:
        await update.message.reply_text("usage: /search @username or /search 123456789")
        return

    arg = context.args[0]
    from db.database import SessionLocal
    from db.models import Waitlist
    db = SessionLocal()
    try:
        if arg.startswith("@"):
            entry = db.query(Waitlist).filter_by(telegram_username=arg[1:]).first()
        else:
            try:
                entry = db.query(Waitlist).filter_by(telegram_user_id=int(arg)).first()
            except ValueError:
                entry = db.query(Waitlist).filter_by(referral_code=arg).first()

        if not entry:
            await update.message.reply_text("not found")
            return

        await update.message.reply_text(
            f"👤 User Info\n\n"
            f"Username: @{entry.telegram_username}\n"
            f"Name: {entry.first_name}\n"
            f"Email: {entry.email or 'not set'}\n"
            f"User ID: {entry.telegram_user_id}\n"
            f"Position: #{entry.position}\n"
            f"Referrals: {entry.referral_count}\n"
            f"Code: {entry.referral_code}\n"
            f"Referred by: {entry.referred_by_code or 'direct'}\n"
            f"Status: {entry.status}\n"
            f"Joined: {entry.created_at}\n"
            f"Via: {entry.joined_via}\n"
            f"Wallet shared: {entry.wallet_address_shared or 'no'}"
        )
    finally:
        db.close()


@admin_only
async def top_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show top referrers. Usage: /top or /top 20"""
    count = 10
    if context.args:
        try:
            count = int(context.args[0])
        except ValueError:
            pass

    from db.database import SessionLocal
    from db.models import Waitlist
    db = SessionLocal()
    try:
        top = (
            db.query(Waitlist)
            .filter(Waitlist.referral_count > 0)
            .order_by(Waitlist.referral_count.desc())
            .limit(count)
            .all()
        )
        if not top:
            await update.message.reply_text("no referrals yet")
            return

        lines = [
            f"{i+1}. @{r.telegram_username or r.telegram_user_id} — {r.referral_count} refs (#{r.position}, {r.status})"
            for i, r in enumerate(top)
        ]
        await update.message.reply_text(f"🏆 Top {len(top)} Referrers\n\n" + "\n".join(lines))
    finally:
        db.close()


@admin_only
async def broadcast_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Broadcast to waitlisted users. Usage: /broadcast your message here"""
    if not context.args:
        await update.message.reply_text("usage: /broadcast your message here")
        return

    message = " ".join(context.args)

    from db.database import SessionLocal
    from db.models import Waitlist
    db = SessionLocal()
    try:
        entries = db.query(Waitlist).filter_by(status="waiting").all()
        if not entries:
            await update.message.reply_text("no waitlisted users to broadcast to")
            return

        await update.message.reply_text(f"broadcasting to {len(entries)} users...")

        main_bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
        if not main_bot_token:
            await update.message.reply_text("TELEGRAM_BOT_TOKEN not set")
            return

        from telegram import Bot
        import asyncio
        bot = Bot(token=main_bot_token)
        sent = 0
        failed = 0
        for entry in entries:
            try:
                await bot.send_message(chat_id=entry.telegram_user_id, text=message)
                sent += 1
                await asyncio.sleep(0.05)  # rate limit: ~20 msg/sec
            except Exception:
                failed += 1

        await update.message.reply_text(f"✅ Broadcast complete: {sent} sent, {failed} failed")
    finally:
        db.close()


@admin_only
async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show admin commands."""
    await update.message.reply_text(
        "🔐 Raze Admin Commands\n\n"
        "/stats — waitlist statistics\n"
        "/top [n] — top referrers (default 10)\n"
        "/approve 50 — approve top N from queue\n"
        "/approve @username — approve specific user\n"
        "/ban @username — ban a user\n"
        "/search @username — look up user info\n"
        "/search 123456789 — search by user ID\n"
        "/broadcast msg — send to all waitlisters\n"
        "/help — this message"
    )


# Workaround: import waitlist functions from the tg-bot package
# Since admin-bot runs in a separate process, we need direct DB access
import importlib.util

def _setup_imports():
    """Set up imports for shared modules."""
    tg_bot_src = Path(__file__).resolve().parent.parent / "tg-bot" / "src"
    waitlist_path = tg_bot_src / "waitlist.py"
    if waitlist_path.exists():
        spec = importlib.util.spec_from_file_location("tg_bot_waitlist", waitlist_path)
        mod = importlib.util.module_from_spec(spec)
        sys.modules["tg_bot_waitlist"] = mod
        spec.loader.exec_module(mod)

_setup_imports()


def main():
    if not ADMIN_BOT_TOKEN:
        logger.error("ADMIN_BOT_TOKEN not set")
        sys.exit(1)

    logger.info(f"Starting Raze Admin Bot (admin user: {ADMIN_USER_ID})")

    app = Application.builder().token(ADMIN_BOT_TOKEN).build()

    app.add_handler(CommandHandler("stats", stats_command))
    app.add_handler(CommandHandler("top", top_command))
    app.add_handler(CommandHandler("approve", approve_command))
    app.add_handler(CommandHandler("ban", ban_command))
    app.add_handler(CommandHandler("search", search_command))
    app.add_handler(CommandHandler("broadcast", broadcast_command))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("start", help_command))

    app.run_polling()


if __name__ == "__main__":
    main()
