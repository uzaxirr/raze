"""Clear all data for a user from production DB. Usage: python scripts/clear_user.py <telegram_user_id> [--prod]"""
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

    print(f"Clearing user {user_id} from {'PROD' if use_prod else 'LOCAL'}...")

    queries = [
        ("user_profiles", f"DELETE FROM user_profiles WHERE telegram_user_id = {int(user_id)}"),
        ("waitlist", f"DELETE FROM waitlist WHERE telegram_user_id = {int(user_id)}"),
        ("agno_sessions (user_id)", f"DELETE FROM agno_sessions WHERE user_id = '{user_id}'"),
        ("agno_sessions (session_id)", f"DELETE FROM agno_sessions WHERE session_id LIKE '%{user_id}%'"),
        ("agno_memories (user_id)", f"DELETE FROM agno_memories WHERE user_id = '{user_id}'"),
    ]

    for name, sql in queries:
        try:
            with engine.connect() as conn:
                r = conn.execute(text(sql))
                conn.commit()
                if r.rowcount > 0:
                    print(f"  {name}: {r.rowcount} deleted")
        except Exception as e:
            err = str(e).split('\n')[0]
            print(f"  {name}: skip ({err})")

    print("Done.")


if __name__ == "__main__":
    uid = sys.argv[1] if len(sys.argv) > 1 else "1327643512"
    use_prod = "--prod" in sys.argv
    clear_user(uid, use_prod)
