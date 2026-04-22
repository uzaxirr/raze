"""Clear all data for a user from production DB.

Usage:
    python scripts/clear_user.py <telegram_user_id> [--prod]
    python scripts/clear_user.py 1327643512 --prod
    python scripts/clear_user.py 1327643512          # local DB
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


def clear_user(user_id: str, use_prod: bool = False):
    url = PROD_URL if use_prod else DB_URL
    engine = create_engine(url)
    uid_int = int(user_id)

    env = "PROD" if use_prod else "LOCAL"
    print(f"Clearing user {user_id} from {env}...")
    print()

    # Order matters: delete from child tables (FKs) before parent tables
    queries = [
        # ── Child tables referencing user_profiles.telegram_user_id ──
        ("price_alerts", f"DELETE FROM price_alerts WHERE user_id = {uid_int}"),
        ("user_preferences", f"DELETE FROM user_preferences WHERE user_id = {uid_int}"),
        ("watched_tokens", f"DELETE FROM watched_tokens WHERE user_id = {uid_int}"),
        ("wallet_alerts", f"DELETE FROM wallet_alerts WHERE user_id = {uid_int}"),
        ("mcp_oauth_pending", f"DELETE FROM mcp_oauth_pending WHERE user_id = {uid_int}"),
        ("user_mcp_servers", f"DELETE FROM user_mcp_servers WHERE user_id = {uid_int}"),

        # ── Signing sessions (by wallet address from user_profiles) ──
        ("sign_session_events", f"DELETE FROM sign_session_events WHERE session_id IN (SELECT id FROM sign_sessions WHERE telegram_chat_id = {uid_int})"),
        ("sign_sessions", f"DELETE FROM sign_sessions WHERE telegram_chat_id = {uid_int}"),

        # ── Waitlist ──
        ("waitlist", f"DELETE FROM waitlist WHERE telegram_user_id = {uid_int}"),

        # ── Agno agent sessions + memories ──
        ("agno_sessions (user_id)", f"DELETE FROM agno_sessions WHERE user_id = '{user_id}'"),
        ("agno_sessions (session_id pattern)", f"DELETE FROM agno_sessions WHERE session_id LIKE '%{user_id}%'"),
        ("agno_memories", f"DELETE FROM agno_memories WHERE user_id = '{user_id}'"),

        # ── Parent table last ──
        ("user_profiles", f"DELETE FROM user_profiles WHERE telegram_user_id = {uid_int}"),
    ]

    total_deleted = 0
    for name, sql in queries:
        try:
            with engine.connect() as conn:
                r = conn.execute(text(sql))
                conn.commit()
                if r.rowcount > 0:
                    print(f"  ✓ {name}: {r.rowcount} deleted")
                    total_deleted += r.rowcount
        except Exception as e:
            err = str(e).split('\n')[0]
            print(f"  - {name}: skip ({err})")

    print()
    print(f"Done. {total_deleted} total rows deleted.")


if __name__ == "__main__":
    uid = sys.argv[1] if len(sys.argv) > 1 else "1327643512"
    use_prod = "--prod" in sys.argv
    clear_user(uid, use_prod)
