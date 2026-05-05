#!/usr/bin/env python3
"""
Lookup Raze users by username or user_id.

Usage:
  python scripts/user_lookup.py <username_or_id>

Examples:
  python scripts/user_lookup.py cryptogirl123     # lookup by username
  python scripts/user_lookup.py 5587078521        # lookup by user_id
"""

import sys
import os
from pathlib import Path

# Load .env from project root
root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(root))

from dotenv import load_dotenv
load_dotenv(root / ".env")

import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not set in .env")
    sys.exit(1)


def lookup(query: str):
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    is_numeric = query.isdigit()

    if is_numeric:
        # Lookup by user_id → find username from waitlist + session info
        user_id = int(query)
        print(f"\n🔍 Looking up user_id: {user_id}\n")

        # Check waitlist table
        cur.execute("""
            SELECT telegram_user_id, telegram_username, first_name, position,
                   referral_code, referral_count, status, joined_via, email
            FROM waitlist
            WHERE telegram_user_id = %s
        """, (user_id,))
        wl = cur.fetchone()

        if wl:
            print(f"  Username:  @{wl['telegram_username'] or '—'}")
            print(f"  Name:      {wl['first_name'] or '—'}")
            print(f"  Email:     {wl['email'] or '—'}")
            print(f"  Position:  #{wl['position']}")
            print(f"  Referrals: {wl['referral_count']}")
            print(f"  Status:    {wl['status']}")
            print(f"  Ref code:  {wl['referral_code']}")
            print(f"  Via:       {wl['joined_via'] or '—'}")
        else:
            print("  Not found in waitlist.")

        # Check user_profiles table
        cur.execute("""
            SELECT telegram_user_id, telegram_username, wallet_address, signing_mode
            FROM user_profiles
            WHERE telegram_user_id = %s
        """, (user_id,))
        up = cur.fetchone()

        if up:
            print(f"\n  Wallet:    {up['wallet_address'] or '—'}")
            print(f"  Signing:   {up['signing_mode'] or '—'}")

        # Check bouncer session
        session_id = f"bouncer_{user_id}"
        cur.execute("""
            SELECT session_id, jsonb_array_length(runs) as msg_count,
                   to_timestamp(created_at) as started,
                   to_timestamp(updated_at) as last_active
            FROM agno_sessions
            WHERE session_id = %s
        """, (session_id,))
        sess = cur.fetchone()

        if sess:
            print(f"\n  Session:   {sess['session_id']}")
            print(f"  Messages:  {sess['msg_count']}")
            print(f"  Started:   {sess['started']}")
            print(f"  Last msg:  {sess['last_active']}")
        else:
            print("\n  No bouncer session found.")

    else:
        # Lookup by username → find user_id
        username = query.lstrip("@").lower()
        print(f"\n🔍 Looking up username: @{username}\n")

        # Check waitlist
        cur.execute("""
            SELECT telegram_user_id, telegram_username, first_name, position,
                   referral_code, referral_count, status, joined_via, email
            FROM waitlist
            WHERE lower(telegram_username) = %s
        """, (username,))
        wl = cur.fetchone()

        if not wl:
            # Try user_profiles
            cur.execute("""
                SELECT telegram_user_id, telegram_username, wallet_address, signing_mode
                FROM user_profiles
                WHERE lower(telegram_username) = %s
            """, (username,))
            up = cur.fetchone()

            if up:
                print(f"  User ID:   {up['telegram_user_id']}")
                print(f"  Username:  @{up['telegram_username'] or '—'}")
                print(f"  Wallet:    {up['wallet_address'] or '—'}")
                # Now check their session
                user_id = up['telegram_user_id']
            else:
                print(f"  No user found with username @{username}")
                cur.close()
                conn.close()
                return
        else:
            user_id = wl['telegram_user_id']
            print(f"  User ID:   {wl['telegram_user_id']}")
            print(f"  Username:  @{wl['telegram_username'] or '—'}")
            print(f"  Name:      {wl['first_name'] or '—'}")
            print(f"  Email:     {wl['email'] or '—'}")
            print(f"  Position:  #{wl['position']}")
            print(f"  Referrals: {wl['referral_count']}")
            print(f"  Status:    {wl['status']}")
            print(f"  Ref code:  {wl['referral_code']}")
            print(f"  Via:       {wl['joined_via'] or '—'}")

        # Check bouncer session
        session_id = f"bouncer_{user_id}"
        cur.execute("""
            SELECT session_id, jsonb_array_length(runs) as msg_count,
                   to_timestamp(created_at) as started,
                   to_timestamp(updated_at) as last_active
            FROM agno_sessions
            WHERE session_id = %s
        """, (session_id,))
        sess = cur.fetchone()

        if sess:
            print(f"\n  Session:   {sess['session_id']}")
            print(f"  Messages:  {sess['msg_count']}")
            print(f"  Started:   {sess['started']}")
            print(f"  Last msg:  {sess['last_active']}")

    cur.close()
    conn.close()
    print()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    lookup(sys.argv[1])
