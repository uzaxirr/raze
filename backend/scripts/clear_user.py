"""Clear all data for a user from production or local DB.

Usage:
    python scripts/clear_user.py <telegram_user_id> [--prod] [--all]
    python scripts/clear_user.py 1327643512 --prod     # clear user from prod
    python scripts/clear_user.py 1327643512            # clear user from local
    python scripts/clear_user.py --all                 # nuke ALL user/session data from local
    python scripts/clear_user.py --all --prod          # nuke ALL user/session data from prod (careful!)
"""
import sys
from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://localhost:5432/razedb")
if DB_URL.startswith("postgresql://"):
    DB_URL = DB_URL.replace("postgresql://", "postgresql+psycopg://", 1)

PROD_URL = "postgresql+psycopg://postgres:XNJPTmoAbjJDUyzFxcsfBKVpEIqWqHzz@mainline.proxy.rlwy.net:48835/railway"


def run_queries(engine, queries):
    """Execute a list of (label, sql) queries. Returns total rows deleted."""
    total = 0
    for name, sql in queries:
        try:
            with engine.connect() as conn:
                r = conn.execute(text(sql))
                conn.commit()
                if r.rowcount > 0:
                    print(f"  ✓ {name}: {r.rowcount} deleted")
                    total += r.rowcount
        except Exception as e:
            err = str(e).split('\n')[0]
            print(f"  - {name}: skip ({err})")
    return total


def clear_user(user_id: str, use_prod: bool = False):
    """Clear all data for a specific user."""
    url = PROD_URL if use_prod else DB_URL
    engine = create_engine(url)
    uid_int = int(user_id)

    env = "PROD" if use_prod else "LOCAL"
    print(f"Clearing user {user_id} from {env}...")
    print()

    # Order matters: child tables (FKs) before parent tables
    queries = [
        # ── Child tables referencing user_profiles.telegram_user_id ──
        ("price_alerts", f"DELETE FROM price_alerts WHERE user_id = {uid_int}"),
        ("user_preferences", f"DELETE FROM user_preferences WHERE user_id = {uid_int}"),
        ("watched_tokens", f"DELETE FROM watched_tokens WHERE user_id = {uid_int}"),
        ("wallet_alerts", f"DELETE FROM wallet_alerts WHERE user_id = {uid_int}"),
        ("mcp_oauth_pending", f"DELETE FROM mcp_oauth_pending WHERE user_id = {uid_int}"),
        ("user_mcp_servers", f"DELETE FROM user_mcp_servers WHERE user_id = {uid_int}"),

        # ── Signing sessions ──
        ("sign_session_events", f"DELETE FROM sign_session_events WHERE session_id IN (SELECT id FROM sign_sessions WHERE telegram_chat_id = {uid_int})"),
        ("sign_sessions", f"DELETE FROM sign_sessions WHERE telegram_chat_id = {uid_int}"),

        # ── Subscriptions ──
        ("subscriptions", f"DELETE FROM subscriptions WHERE telegram_user_id = {uid_int}"),

        # ── Waitlist ──
        ("waitlist", f"DELETE FROM waitlist WHERE telegram_user_id = {uid_int}"),

        # ── Agno tables (by user_id + session_id pattern) ──
        ("agno_spans", f"DELETE FROM agno_spans WHERE trace_id IN (SELECT trace_id FROM agno_traces WHERE session_id LIKE '%{user_id}%')"),
        ("agno_traces", f"DELETE FROM agno_traces WHERE session_id LIKE '%{user_id}%'"),
        ("agno_metrics", f"DELETE FROM agno_metrics WHERE session_id LIKE '%{user_id}%'"),
        ("agno_learnings", f"DELETE FROM agno_learnings WHERE user_id = '{user_id}'"),
        ("agno_memories", f"DELETE FROM agno_memories WHERE user_id = '{user_id}'"),
        ("agno_sessions (user_id)", f"DELETE FROM agno_sessions WHERE user_id = '{user_id}'"),
        ("agno_sessions (session_id)", f"DELETE FROM agno_sessions WHERE session_id LIKE '%{user_id}%'"),

        # ── Parent table last ──
        ("user_profiles", f"DELETE FROM user_profiles WHERE telegram_user_id = {uid_int}"),
    ]

    total = run_queries(engine, queries)
    print(f"\nDone. {total} total rows deleted.")


def clear_all(use_prod: bool = False):
    """Nuke ALL user/session data. Preserves schema versions and config."""
    url = PROD_URL if use_prod else DB_URL
    engine = create_engine(url)

    env = "PROD" if use_prod else "LOCAL"

    if use_prod:
        confirm = input(f"⚠️  This will DELETE ALL user data from PRODUCTION. Type 'yes' to confirm: ")
        if confirm.strip().lower() != "yes":
            print("Aborted.")
            return

    print(f"Clearing ALL user/session data from {env}...")
    print()

    # Everything except schema/config tables
    queries = [
        # Child tables first
        ("sign_session_events", "DELETE FROM sign_session_events"),
        ("sign_sessions", "DELETE FROM sign_sessions"),
        ("price_alerts", "DELETE FROM price_alerts"),
        ("user_preferences", "DELETE FROM user_preferences"),
        ("watched_tokens", "DELETE FROM watched_tokens"),
        ("wallet_alerts", "DELETE FROM wallet_alerts"),
        ("mcp_oauth_pending", "DELETE FROM mcp_oauth_pending"),
        ("user_mcp_servers", "DELETE FROM user_mcp_servers"),
        ("waitlist", "DELETE FROM waitlist"),
        # Agno tables
        ("agno_spans", "DELETE FROM agno_spans"),
        ("agno_traces", "DELETE FROM agno_traces"),
        ("agno_metrics", "DELETE FROM agno_metrics"),
        ("agno_learnings", "DELETE FROM agno_learnings"),
        ("agno_memories", "DELETE FROM agno_memories"),
        ("agno_sessions", "DELETE FROM agno_sessions"),
        # Parent table
        ("user_profiles", "DELETE FROM user_profiles"),
    ]

    total = run_queries(engine, queries)
    print(f"\nDone. {total} total rows deleted.")
    print("Preserved: alembic_version, agno_schema_versions, helius_webhook_config")


if __name__ == "__main__":
    use_prod = "--prod" in sys.argv
    nuke_all = "--all" in sys.argv

    if nuke_all:
        clear_all(use_prod)
    else:
        uid = next((a for a in sys.argv[1:] if not a.startswith("--")), "1327643512")
        clear_user(uid, use_prod)
