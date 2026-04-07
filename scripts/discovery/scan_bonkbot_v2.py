"""
BONKbot Scanner V2 — Focused on Pain Points 2 & 3
- Pain 2: Fund access / wallet lockout / withdrawal friction
- Pain 3: Missing features (sniping, charting, sentiment, analytics)

Scans deeper (7 days, 1000 msgs) and ONLY surfaces users with public usernames.
"""

import os
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

BONKBOT_CHAT_ID = -1001982156375
SCAN_DAYS = 7
MAX_MESSAGES = 1000
LLM_BATCH_SIZE = 30


ANALYSIS_PROMPT = """You are scanning BONKbot Telegram chat to find users experiencing TWO specific pain points. ONLY flag users matching these categories:

**PAIN 2 — FUND ACCESS / WALLET PROBLEMS:**
- Can't withdraw tokens (SOL or SPL tokens)
- Locked out due to 2FA / Google Authenticator issues
- Need to export seedphrase to Phantom to move tokens
- Deposit went in but can't get it out
- Wallet recovery problems
- Confused about how to move funds between wallets
- Money stuck, frozen, or inaccessible

**PAIN 3 — MISSING FEATURES / HIT THE CEILING:**
- Wants sniping but BONKbot doesn't have it
- Needs better charting / timeframe data (5min, 1hr, 4hr price changes)
- Wants copy trading or whale wallet tracking
- Asking for sentiment analysis, token research, or market intelligence
- Wants security scanning (honeypot, rug detection) before buying
- Comparing BONKbot unfavorably to other tools
- Power user who's outgrown BONKbot's capabilities
- Asking "can BONKbot do X?" where X is an advanced feature

IGNORE everything else: price talk, speed complaints, general chat, shilling, bot commands, greetings, memes, transaction confirmations.

For each target found, respond in JSON:
```json
{
  "results": [
    {
      "msg_index": 0,
      "is_target": true,
      "confidence": 0.0-1.0,
      "pain_type": "fund_access" or "missing_features",
      "specific_pain": "one-line description of their exact problem",
      "raze_solution": "which Raze feature directly solves this"
    }
  ]
}
```

Only include is_target=true entries with confidence >= 0.65. Return {"results": []} if none qualify.

Messages:

"""


DM_PROMPT_FUND_ACCESS = """Write a short Telegram DM (2-3 sentences max) to a BONKbot user who has fund access / wallet problems.

Key Raze selling points for this pain:
- Privy embedded wallets — no seedphrase to lose or export
- Withdraw any SPL token directly, not just SOL
- No Google Authenticator 2FA that locks you out if you change phones
- Simple wallet management through natural conversation

Rules:
- Reference their SPECIFIC problem from their messages
- Sound like a crypto person, not a salesperson
- Offer free access for a week
- Casual lowercase energy, max 1 emoji
- Don't say "AI" — say "trading bot" or just "bot"
- Keep it under 40 words

Their username: @{username}
Their messages:
{messages}

Write ONLY the DM:"""


DM_PROMPT_MISSING_FEATURES = """Write a short Telegram DM (2-3 sentences max) to a BONKbot user who wants features BONKbot doesn't have.

Key Raze selling points for this pain:
- Token sniping with momentum scoring (scores tokens on security + volume + momentum before you ape)
- Multi-timeframe performance data (5min, 1hr, 4hr, 24hr)
- Sentiment analysis from LunarCrush (social buzz, news sentiment)
- Whale wallet tracking with real-time alerts
- Token security scanning (honeypot, rug pull, mint authority checks)
- Prediction markets integration (Polymarket odds)

Rules:
- Reference their SPECIFIC feature request or limitation from their messages
- Lead with the feature they want, not a generic pitch
- Sound like a crypto person, not a salesperson
- Offer free access for a week
- Casual lowercase energy, max 1 emoji
- Don't say "AI agent" — say "trading bot" or just "bot"
- Keep it under 40 words

Their username: @{username}
Their messages:
{messages}

Write ONLY the DM:"""


async def analyze_batch(messages_batch):
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
    msgs_text = "\n".join(f'  - "{m["text"][:200]}"' for m in target["messages"][:3])
    pain = target["pain_type"]

    prompt_template = DM_PROMPT_FUND_ACCESS if pain == "fund_access" else DM_PROMPT_MISSING_FEATURES
    prompt = prompt_template.format(username=target["username"], messages=msgs_text)

    try:
        response = claude.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text.strip().strip('"')
    except Exception as e:
        return f"(failed: {e})"


async def main():
    print("=" * 60)
    print("  BONKBOT SCANNER V2 — Fund Access + Missing Features")
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

    entity = await client.get_entity(BONKBOT_CHAT_ID)
    title = getattr(entity, "title", "BONKbot Chat")
    print(f"Scanning: {title}")
    print(f"Range: {SCAN_DAYS} days | Max: {MAX_MESSAGES} messages")
    print(f"Focus: fund_access + missing_features ONLY\n")

    cutoff = datetime.utcnow() - timedelta(days=SCAN_DAYS)

    raw_messages = []
    skipped_no_username = 0
    total = 0

    print("Collecting messages...")
    async for message in client.iter_messages(entity, limit=MAX_MESSAGES):
        total += 1
        if message.date.replace(tzinfo=None) < cutoff:
            break

        if not message.text or len(message.text) < 15:
            continue

        sender = await message.get_sender()
        if not sender or not isinstance(sender, User) or sender.bot:
            continue

        # ONLY keep users with public usernames (so we can DM them)
        if not sender.username:
            skipped_no_username += 1
            continue

        raw_messages.append({
            "text": message.text,
            "username": sender.username,
            "full_name": f"{sender.first_name or ''} {sender.last_name or ''}".strip(),
            "user_id": sender.id,
            "date": message.date.strftime("%Y-%m-%d %H:%M"),
            "message_id": message.id,
        })

    print(f"Total: {total} messages")
    print(f"With text + username: {len(raw_messages)}")
    print(f"Skipped (no username): {skipped_no_username}\n")

    if not raw_messages:
        print("No messages to analyze.")
        await client.disconnect()
        return

    # Analyze
    print(f"{'=' * 60}")
    print(f"  ANALYZING WITH CLAUDE HAIKU (focused prompt)")
    print(f"{'=' * 60}\n")

    all_targets = []
    llm_calls = 0

    for i in range(0, len(raw_messages), LLM_BATCH_SIZE):
        batch = raw_messages[i:i + LLM_BATCH_SIZE]
        batch_num = (i // LLM_BATCH_SIZE) + 1
        total_batches = (len(raw_messages) + LLM_BATCH_SIZE - 1) // LLM_BATCH_SIZE

        print(f"  Batch {batch_num}/{total_batches}...", end=" ", flush=True)
        results = await analyze_batch(batch)
        llm_calls += 1

        hits = [r for r in results if r.get("is_target") and r.get("confidence", 0) >= 0.65]
        all_targets.extend(hits)

        fund = sum(1 for r in hits if r.get("pain_type") == "fund_access")
        feat = sum(1 for r in hits if r.get("pain_type") == "missing_features")
        print(f"→ {len(hits)} targets (fund_access: {fund}, missing_features: {feat})")
        await asyncio.sleep(0.5)

    # Deduplicate
    user_profiles = defaultdict(lambda: {
        "username": "", "full_name": "", "user_id": None,
        "messages": [], "pain_type": "", "specific_pains": [],
        "raze_solutions": [], "max_confidence": 0,
    })

    for t in all_targets:
        orig = t.get("original", {})
        uid = orig.get("user_id")
        if not uid:
            continue

        p = user_profiles[uid]
        p["username"] = orig["username"]
        p["full_name"] = orig["full_name"]
        p["user_id"] = uid
        p["messages"].append({
            "text": orig["text"],
            "date": orig["date"],
            "message_id": orig["message_id"],
        })
        # Use highest-confidence pain type
        if t.get("confidence", 0) > p["max_confidence"]:
            p["pain_type"] = t.get("pain_type", "")
            p["max_confidence"] = t["confidence"]
        if t.get("specific_pain"):
            p["specific_pains"].append(t["specific_pain"])
        if t.get("raze_solution"):
            p["raze_solutions"].append(t["raze_solution"])

    # Score and rank
    ranked = []
    for uid, p in user_profiles.items():
        score = (
            p["max_confidence"] * 10
            + len(p["messages"]) * 3
            + len(p["specific_pains"]) * 2
        )
        p["score"] = round(score, 1)
        ranked.append(p)

    ranked.sort(key=lambda x: x["score"], reverse=True)

    # Split by pain type
    fund_access = [t for t in ranked if t["pain_type"] == "fund_access"]
    missing_features = [t for t in ranked if t["pain_type"] == "missing_features"]

    print(f"\n{'=' * 60}")
    print(f"  RESULTS")
    print(f"  Total unique targets: {len(ranked)}")
    print(f"  Fund access problems: {len(fund_access)}")
    print(f"  Missing features: {len(missing_features)}")
    print(f"{'=' * 60}")

    # Display + generate DMs
    for label, targets in [("FUND ACCESS / WALLET LOCKOUT", fund_access), ("MISSING FEATURES", missing_features)]:
        if not targets:
            continue
        print(f"\n{'─' * 55}")
        print(f"  {label} ({len(targets)} targets)")
        print(f"{'─' * 55}\n")

        for i, t in enumerate(targets, 1):
            print(f"  #{i} @{t['username']} ({t['full_name']}) — confidence: {t['max_confidence']}")
            if t["specific_pains"]:
                print(f"     Pain: {t['specific_pains'][0]}")
            if t["raze_solutions"]:
                print(f"     Solution: {t['raze_solutions'][0]}")
            for msg in t["messages"][:2]:
                text = msg["text"][:140].replace("\n", " ")
                print(f"     [{msg['date']}] \"{text}\"")

            # Generate DM
            print(f"     Generating DM...", end=" ", flush=True)
            dm = await generate_dm(t)
            t["suggested_dm"] = dm
            print("done")
            print(f"     📩 DM: \"{dm}\"")
            print()
            await asyncio.sleep(0.3)

    # Save
    output_file = os.path.join(os.path.dirname(__file__), "bonkbot_targets_v2.json")
    output = {
        "scan_date": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
        "source": "BONKbot Chat",
        "scan_days": SCAN_DAYS,
        "focus": ["fund_access", "missing_features"],
        "messages_scanned": total,
        "messages_analyzed": len(raw_messages),
        "skipped_no_username": skipped_no_username,
        "llm_calls": llm_calls,
        "total_targets": len(ranked),
        "fund_access_targets": len(fund_access),
        "missing_features_targets": len(missing_features),
        "targets_fund_access": fund_access,
        "targets_missing_features": missing_features,
    }
    with open(output_file, "w") as f:
        json.dump(output, f, indent=2, default=str)

    print(f"\nSaved to: {output_file}")
    print(f"\nREADY TO DM:")
    all_dmable = [t for t in ranked if t.get("suggested_dm")]
    for i, t in enumerate(all_dmable[:10], 1):
        print(f"  {i}. @{t['username']} ({t['pain_type']}): {t['suggested_dm'][:80]}...")

    await client.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
