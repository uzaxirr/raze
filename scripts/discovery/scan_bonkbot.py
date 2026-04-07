"""
Scan BONKbot Chat for potential Raze customers.
Uses Claude Haiku to analyze messages for pain points.
"""

import os
import sys
import json
import asyncio
from datetime import datetime, timedelta
from collections import defaultdict
from dotenv import load_dotenv
from telethon import TelegramClient
from telethon.tl.types import User
import anthropic

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

API_ID = int(os.getenv("TG_API_ID"))
API_HASH = os.getenv("TG_API_HASH")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
PHONE = "+918983733336"
SESSION_FILE = os.path.join(os.path.dirname(__file__), "session")

claude = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

# BONKbot Chat — from web.telegram.org URL
BONKBOT_CHAT_ID = -1001982156375

SCAN_DAYS = 3
MAX_MESSAGES = 500
LLM_BATCH_SIZE = 25


ANALYSIS_PROMPT = """You are analyzing Telegram messages from the BONKbot community chat to find potential customers for Raze — an AI-powered Solana trading agent inside Telegram.

Raze differentiates from BONKbot by offering:
- Natural language interface (no button menus — just talk)
- Built-in sentiment analysis (LunarCrush data)
- Whale wallet tracking with real-time alerts (Helius webhooks)
- Prediction markets integration (Polymarket)
- Token security scanning (honeypot, rug pull detection)
- Token sniping with multi-factor momentum scoring
- A savage/roasting personality that keeps users engaged
- BYOMCP — users can plug in their own tools

Analyze each message. A strong target is someone who:
1. Is frustrated with BONKbot's limitations (speed, fees, features, UX)
2. Is asking for features BONKbot doesn't have (sentiment, research, whale tracking, AI)
3. Is comparing bots or asking for alternatives
4. Is doing manual work that Raze automates (checking multiple sites, copy-pasting addresses)
5. Had a failed transaction, got scammed, or lost money due to tool limitations
6. Is an active trader hitting the ceiling of what BONKbot can do

IGNORE messages that are:
- Just price talk / speculation without tool complaints
- Bot command outputs or transaction confirmations
- Token shilling / promotion
- Very short messages with no meaningful signal
- General greetings or memes

For targets found, respond in JSON:
```json
{
  "results": [
    {
      "msg_index": 0,
      "is_target": true,
      "confidence": 0.0-1.0,
      "pain_categories": [],
      "reasoning": "why this person is a good target",
      "raze_angle": "which specific Raze feature addresses their pain"
    }
  ]
}
```

Only include entries where is_target=true and confidence >= 0.6. If none qualify, return {"results": []}.

Messages to analyze:

"""


DM_PROMPT = """Write a short Telegram DM (2-3 sentences) to recruit this BONKbot user to try Raze.

Rules:
- Reference their SPECIFIC complaint or need from their messages
- Sound like a crypto-native person, not a marketer
- Offer free access for a week
- Casual, lowercase energy
- Max 1 emoji
- Don't mention "AI" unless they specifically want AI features — lead with the outcome

Target: @{username}
Their pain: {categories}
Their messages:
{messages}

Write ONLY the DM text:"""


async def analyze_batch(messages_batch):
    """Analyze a batch of messages with Claude."""
    formatted = ""
    for i, msg in enumerate(messages_batch):
        text = msg["text"][:250].replace("\n", " ")
        formatted += f"[{i}] @{msg['username']}: {text}\n"

    try:
        response = claude.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2000,
            messages=[{"role": "user", "content": ANALYSIS_PROMPT + formatted}],
        )

        content = response.content[0].text
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]

        parsed = json.loads(content)
        results = parsed.get("results", [])

        for r in results:
            idx = r.get("msg_index", -1)
            if 0 <= idx < len(messages_batch):
                r["original"] = messages_batch[idx]

        return results
    except Exception as e:
        print(f"    LLM error: {e}")
        return []


async def generate_dm(target):
    """Generate personalized DM."""
    msgs_text = "\n".join(f'  - "{m["text"][:150]}"' for m in target["messages"][:3])

    try:
        response = claude.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=250,
            messages=[{"role": "user", "content": DM_PROMPT.format(
                username=target["username"],
                categories=", ".join(target["all_categories"]),
                messages=msgs_text,
            )}],
        )
        return response.content[0].text.strip()
    except Exception as e:
        return f"(failed: {e})"


async def main():
    print("=" * 60)
    print("  BONKBOT CHAT SCANNER — Finding Raze Customers")
    print("=" * 60)
    print()

    client = TelegramClient(SESSION_FILE, API_ID, API_HASH)
    await client.connect()

    if not await client.is_user_authorized():
        print("Not authenticated. Run 'python3 auth.py' first.")
        await client.disconnect()
        return

    me = await client.get_me()
    print(f"Logged in as: {me.first_name} (@{me.username})\n")

    # Get BONKbot chat entity
    print(f"Connecting to BONKbot Chat (ID: {BONKBOT_CHAT_ID})...")
    try:
        entity = await client.get_entity(BONKBOT_CHAT_ID)
        title = getattr(entity, "title", "BONKbot Chat")
        members = getattr(entity, "participants_count", "?")
        print(f"Connected: {title} ({members} members)\n")
    except Exception as e:
        print(f"Failed to connect: {e}")
        print("Make sure you've joined the BONKbot Chat group first.")
        await client.disconnect()
        return

    # Collect messages
    cutoff = datetime.utcnow() - timedelta(days=SCAN_DAYS)
    print(f"Collecting messages from last {SCAN_DAYS} days...")

    raw_messages = []
    total_scanned = 0

    async for message in client.iter_messages(entity, limit=MAX_MESSAGES):
        total_scanned += 1
        if message.date.replace(tzinfo=None) < cutoff:
            break

        if not message.text or len(message.text) < 15:
            continue

        sender = await message.get_sender()
        if not sender or not isinstance(sender, User) or sender.bot:
            continue

        raw_messages.append({
            "text": message.text,
            "username": sender.username or f"id_{sender.id}",
            "full_name": f"{sender.first_name or ''} {sender.last_name or ''}".strip(),
            "user_id": sender.id,
            "date": message.date.strftime("%Y-%m-%d %H:%M"),
            "message_id": message.id,
        })

    print(f"Scanned {total_scanned} messages, {len(raw_messages)} have text content\n")

    if not raw_messages:
        print("No messages found. The group might be quiet or you might not have access.")
        await client.disconnect()
        return

    # Analyze with LLM
    print(f"{'=' * 60}")
    print(f"  ANALYZING WITH CLAUDE HAIKU")
    print(f"  {len(raw_messages)} messages in batches of {LLM_BATCH_SIZE}")
    print(f"{'=' * 60}\n")

    all_targets = []
    llm_calls = 0

    for i in range(0, len(raw_messages), LLM_BATCH_SIZE):
        batch = raw_messages[i:i + LLM_BATCH_SIZE]
        batch_num = (i // LLM_BATCH_SIZE) + 1
        total_batches = (len(raw_messages) + LLM_BATCH_SIZE - 1) // LLM_BATCH_SIZE

        print(f"  Batch {batch_num}/{total_batches} ({len(batch)} msgs)...", end=" ", flush=True)

        results = await analyze_batch(batch)
        llm_calls += 1

        targets_in_batch = [r for r in results if r.get("is_target") and r.get("confidence", 0) >= 0.6]
        all_targets.extend(targets_in_batch)

        print(f"→ {len(targets_in_batch)} targets (confidence ≥ 0.6)")
        await asyncio.sleep(0.5)

    # Deduplicate by user
    print(f"\n{'=' * 60}")
    print(f"  DEDUPLICATING & RANKING")
    print(f"{'=' * 60}\n")

    user_profiles = defaultdict(lambda: {
        "username": "", "full_name": "", "user_id": None,
        "messages": [], "all_categories": set(), "max_confidence": 0,
        "reasonings": [], "raze_angles": [],
    })

    for t in all_targets:
        orig = t.get("original", {})
        uid = orig.get("user_id")
        if not uid:
            continue

        user_profiles[uid]["username"] = orig["username"]
        user_profiles[uid]["full_name"] = orig["full_name"]
        user_profiles[uid]["user_id"] = uid
        user_profiles[uid]["messages"].append({
            "text": orig["text"],
            "date": orig["date"],
            "message_id": orig["message_id"],
        })
        user_profiles[uid]["all_categories"].update(t.get("pain_categories", []))
        user_profiles[uid]["max_confidence"] = max(
            user_profiles[uid]["max_confidence"], t.get("confidence", 0)
        )
        if t.get("reasoning"):
            user_profiles[uid]["reasonings"].append(t["reasoning"])
        if t.get("raze_angle"):
            user_profiles[uid]["raze_angles"].append(t["raze_angle"])

    # Score
    ranked = []
    for uid, p in user_profiles.items():
        score = (
            p["max_confidence"] * 10
            + len(p["all_categories"]) * 3
            + len(p["messages"]) * 2
        )
        p["score"] = round(score, 1)
        p["all_categories"] = list(p["all_categories"])
        ranked.append(p)

    ranked.sort(key=lambda x: x["score"], reverse=True)

    # Display results
    print(f"{'=' * 60}")
    print(f"  FOUND {len(ranked)} UNIQUE TARGETS")
    print(f"  LLM calls: {llm_calls} | Model: claude-haiku-4-5")
    print(f"{'=' * 60}\n")

    top_n = min(20, len(ranked))
    for i, t in enumerate(ranked[:top_n], 1):
        print(f"{'─' * 55}")
        print(f"#{i} @{t['username']} ({t['full_name']})")
        print(f"   Score: {t['score']} | Confidence: {t['max_confidence']}")
        print(f"   Pain: {', '.join(t['all_categories'])}")
        if t["reasonings"]:
            print(f"   Why: {t['reasonings'][0]}")
        if t["raze_angles"]:
            print(f"   Pitch: {t['raze_angles'][0]}")
        for msg in t["messages"][:2]:
            text = msg["text"][:120].replace("\n", " ")
            print(f"   [{msg['date']}] \"{text}\"")
        print()

    # Generate DMs for top targets
    if ranked:
        dm_count = min(10, len(ranked))
        print(f"\n{'=' * 60}")
        print(f"  GENERATING {dm_count} PERSONALIZED DMs")
        print(f"{'=' * 60}\n")

        for i, t in enumerate(ranked[:dm_count], 1):
            print(f"  Crafting DM for @{t['username']}...", end=" ", flush=True)
            dm = await generate_dm(t)
            t["suggested_dm"] = dm
            print("done")
            print(f"\n  #{i} → @{t['username']}:")
            print(f"  \"{dm}\"")
            print()
            await asyncio.sleep(0.3)

    # Save results
    output_file = os.path.join(os.path.dirname(__file__), "bonkbot_targets.json")
    output = {
        "scan_date": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
        "source": "BONKbot Chat",
        "scan_days": SCAN_DAYS,
        "messages_scanned": total_scanned,
        "messages_analyzed": len(raw_messages),
        "llm_calls": llm_calls,
        "unique_targets": len(ranked),
        "targets": ranked[:50],
    }
    with open(output_file, "w") as f:
        json.dump(output, f, indent=2, default=str)

    print(f"\nResults saved to: {output_file}")
    print(f"\nNEXT STEPS:")
    print(f"  1. Review DMs above — tweak if needed")
    print(f"  2. Send top 5 DMs today")
    print(f"  3. Track who responds in bonkbot_targets.json")
    print(f"  4. Re-run in 2-3 days: python3 scan_bonkbot.py")

    await client.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
