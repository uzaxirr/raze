"""
Telegram authentication — run in your terminal:
  python3 auth.py

It will send a code to Telegram, ask you to type it, and save the session.
After that scan_bonkbot.py works without any prompts.
"""

import os
import asyncio
from dotenv import load_dotenv
from telethon import TelegramClient
from telethon.errors import SessionPasswordNeededError

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

API_ID = int(os.getenv("TG_API_ID"))
API_HASH = os.getenv("TG_API_HASH")
PHONE = "+918983733336"
SESSION_FILE = os.path.join(os.path.dirname(__file__), "session")


async def main():
    client = TelegramClient(SESSION_FILE, API_ID, API_HASH)
    await client.connect()

    if await client.is_user_authorized():
        me = await client.get_me()
        print(f"Already authenticated as: {me.first_name} (@{me.username})")
        print("Session is valid. Run: python3 scan_bonkbot.py")
        await client.disconnect()
        return

    print(f"Sending code to {PHONE}...")
    result = await client.send_code_request(PHONE)
    print("Code sent! Check your Telegram app.")

    code = input("\nEnter the code: ").strip()

    try:
        await client.sign_in(phone=PHONE, code=code, phone_code_hash=result.phone_code_hash)
    except SessionPasswordNeededError:
        pw = input("2FA password required. Enter password: ").strip()
        await client.sign_in(password=pw)

    me = await client.get_me()
    print(f"\nAuthenticated as: {me.first_name} (@{me.username})")
    print("Session saved! Now run: python3 scan_bonkbot.py")
    await client.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
