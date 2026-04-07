"""
Telegram Group Scanner for Customer Discovery (LLM-Powered)

Scans joined Telegram groups for users expressing pain points with existing
trading bots/tools. Uses Claude to understand message intent — not just keywords.
Outputs ranked targets with personalized DM scripts.
"""

import os
import sys
import json
import asyncio
from datetime import datetime, timedelta
from collections import defaultdict
from dotenv import load_dotenv
from telethon import TelegramClient
from telethon.tl.types import Channel, Chat, User
import anthropic

# Load env from both discovery dir and project root
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

API_ID = int(os.getenv("TG_API_ID"))
API_HASH = os.getenv("TG_API_HASH")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
SESSION_FILE = os.path.join(os.path.dirname(__file__), "session")

claude = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

# Target groups from our research
TARGET_GROUPS = [
    "bonkbotchat", "bonkbot_bot", "bonkbotnewtokenalerts",
    "trojan_on_solana", "solana_trojanbot", "trysuperx",
    "hellokook", "pumpfunsol", "solanamemecoinss",
    "solanamemecryptocoins", "bestcallsolana", "solanatopdogz", "solana",
]

SCAN_DAYS = 3
MAX_MESSAGES_PER_GROUP = 500
# How many messages to batch per LLM call (cost optimization)
LLM_BATCH_SIZE = 30


ANALYSIS_PROMPT = """You are analyzing Telegram messages from a crypto trading group to find potential customers for Raze — an AI-powered Solana trading agent inside Telegram that combines swaps, sentiment analysis, whale tracking, price alerts, and prediction markets in one conversational interface.

Analyze each message and determine if the sender is a potential customer. A potential customer is someone who:

1. **Frustrated with existing tools** — complaining about BonkBot, Trojan, Maestro, Photon, Axiom, or any trading bot being slow, expensive, limited, or broken
2. **Doing manual work that Raze automates** — copy-pasting addresses, checking multiple tabs, manually tracking wallets, switching between tools
3. **Seeking alternatives** — asking for bot recommendations, comparing tools, looking for something better
4. **Wants features Raze has** — sentiment analysis, AI-powered research, whale tracking, natural language trading, copy trading with context
5. **Security/trust concerns** — worried about getting rugged, front-run, or scammed (Raze has security scanning)
6. **Power user hitting limits** — clearly an active trader who's outgrown their current tools

IMPORTANT: Ignore messages that are just:
- Price discussion / speculation without tool complaints
- Shilling / promoting tokens
- General crypto news sharing
- Bot commands or transaction outputs
- Greetings or social chatter
- Messages too short to have meaningful signal

For each message, respond in JSON format:

```json
{
  "results": [
    {
      "msg_index": 0,
      "is_target": true/false,
      "confidence": 0.0-1.0,
      "pain_categories": ["seeking_alternatives", "frustrated_with_fees", "wants_ai", "manual_workflow", "security_concerns", "missing_features", "slow_execution", "tool_fragmentation"],
      "reasoning": "brief explanation of why this person is/isn't a target",
      "suggested_angle": "what specific Raze feature to pitch them on"
    }
  ]
}
```

Only include entries where is_target=true. If none are targets, return {"results": []}.

Here are the messages to analyze (format: [index] username: message):

"""


DM_GENERATION_PROMPT = """You are crafting a Telegram DM to a potential user for Raze — an AI-powered Solana trading agent inside Telegram. Raze combines token swaps (Jupiter), sentiment analysis (LunarCrush), whale wallet tracking (Helius), price alerts, prediction markets (Polymarket), and security scanning in one conversational interface. It has a savage/roasting personality.

Based on the target's pain points and their actual messages, write a SHORT, natural DM (2-3 sentences max). Rules:
- Sound like a real person, not a marketer
- Reference their SPECIFIC complaint or need (prove you understand their pain)
- Offer free access for a week
- Don't oversell — be casual
- Use lowercase energy, crypto native language
- Don't use emojis excessively (1 max)

Target info:
Username: @{username}
Pain categories: {categories}
Their actual messages:
{messages}
Group(s) they're in: {groups}

Write ONLY the DM text, nothing else."""


async def analyze_messages_with_llm(messages_batch: list[dict]) -> list[dict]:
    """Send a batch of messages to Claude for analysis."""
    if not messages_batch:
        return []

    formatted = ""
    for i, msg in enumerate(messages_batch):
        text = msg["text"][:200].replace("\n", " ")
        formatted += f"[{i}] @{msg['username']}: {text}\n"

    try:
        response = claude.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2000,
            messages=[{"role": "user", "content": ANALYSIS_PROMPT + formatted}],
        )

        content = response.content[0].text
        # Extract JSON from response
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]

        parsed = json.loads(content)
        results = parsed.get("results", [])

        # Attach original message data to results
        for r in results:
            idx = r["msg_index"]
            if 0 <= idx < len(messages_batch):
                r["original"] = messages_batch[idx]

        return results

    except Exception as e:
        print(f"  LLM analysis error: {e}")
        return []


async def generate_dm(target: dict) -> str:
    """Generate a personalized DM for a target using Claude."""
    messages_text = ""
    for msg in target["messages"][:3]:
        messages_text += f"  - \"{msg['text'][:150]}\"\n"

    prompt = DM_GENERATION_PROMPT.format(
        username=target["username"],
        categories=", ".join(target["all_categories"]),
        messages=messages_text,
        groups=", ".join(target["groups_seen_in"]),
    )

    try:
        response = claude.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=300,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text.strip()
    except Exception as e:
        return f"(DM generation failed: {e})"


async def main():
    print("=" * 60)
    print("  RAZE CUSTOMER DISCOVERY SCANNER (LLM-Powered)")
    print("=" * 60)
    print()

    client = TelegramClient(SESSION_FILE, API_ID, API_HASH)
    await client.start()

    me = await client.get_me()
    print(f"Logged in as: {me.first_name} (@{me.username})")
    print()

    # Step 1: List all joined groups/channels
    print("Fetching your groups and channels...")
    dialogs = await client.get_dialogs()

    groups = []
    for dialog in dialogs:
        entity = dialog.entity
        if isinstance(entity, (Channel, Chat)):
            name = getattr(entity, "title", "Unknown")
            username = getattr(entity, "username", None)
            member_count = getattr(entity, "participants_count", "?")
            groups.append({
                "entity": entity,
                "name": name,
                "username": username,
                "members": member_count,
            })

    # Match target groups
    target_joined = []
    other_groups = []
    for g in groups:
        is_target = g["username"] and g["username"].lower() in TARGET_GROUPS
        if is_target:
            target_joined.append(g)
        else:
            other_groups.append(g)

    print(f"\nFound {len(groups)} total groups/channels")
    print(f"\nTARGET GROUPS JOINED ({len(target_joined)}):")
    for g in target_joined:
        print(f"  - {g['name']} (@{g['username']}) — {g['members']} members")

    if not target_joined:
        print("  (none of the target groups found — will scan all groups)")

    print(f"\nOther groups: {len(other_groups)}")
    for g in other_groups[:5]:
        uname = f" (@{g['username']})" if g["username"] else ""
        print(f"  - {g['name']}{uname}")
    if len(other_groups) > 5:
        print(f"  ... and {len(other_groups) - 5} more")

    # Step 2: Scan
    groups_to_scan = target_joined if target_joined else groups[:10]
    cutoff_date = datetime.utcnow() - timedelta(days=SCAN_DAYS)

    print(f"\n{'=' * 60}")
    print(f"  SCANNING {len(groups_to_scan)} GROUPS (last {SCAN_DAYS} days)")
    print(f"  Using Claude Haiku for message analysis")
    print(f"{'=' * 60}\n")

    all_targets = []
    group_stats = {}
    total_llm_calls = 0

    for g in groups_to_scan:
        group_name = g["name"]
        entity = g["entity"]
        print(f"\nScanning: {group_name}...")

        raw_messages = []

        try:
            async for message in client.iter_messages(entity, limit=MAX_MESSAGES_PER_GROUP):
                if message.date.replace(tzinfo=None) < cutoff_date:
                    break

                if not message.text or len(message.text) < 15:
                    continue

                sender = await message.get_sender()
                if not sender or not isinstance(sender, User) or sender.bot:
                    continue

                username = sender.username or f"id_{sender.id}"
                raw_messages.append({
                    "text": message.text,
                    "username": username,
                    "full_name": f"{sender.first_name or ''} {sender.last_name or ''}".strip(),
                    "user_id": sender.id,
                    "date": message.date.strftime("%Y-%m-%d %H:%M"),
                    "message_id": message.id,
                    "group": group_name,
                    "group_username": g["username"],
                })

            print(f"  Collected {len(raw_messages)} messages, analyzing with LLM...")

            # Batch analyze with LLM
            group_targets = []
            for i in range(0, len(raw_messages), LLM_BATCH_SIZE):
                batch = raw_messages[i:i + LLM_BATCH_SIZE]
                batch_num = (i // LLM_BATCH_SIZE) + 1
                total_batches = (len(raw_messages) + LLM_BATCH_SIZE - 1) // LLM_BATCH_SIZE
                print(f"  Analyzing batch {batch_num}/{total_batches}...", end=" ", flush=True)

                results = await analyze_messages_with_llm(batch)
                total_llm_calls += 1

                for r in results:
                    if r.get("is_target") and r.get("confidence", 0) >= 0.6:
                        orig = r.get("original", {})
                        target = {
                            "username": orig.get("username", "unknown"),
                            "full_name": orig.get("full_name", ""),
                            "user_id": orig.get("user_id"),
                            "message": orig.get("text", ""),
                            "date": orig.get("date", ""),
                            "group": group_name,
                            "group_username": g["username"],
                            "message_link": f"https://t.me/{g['username']}/{orig.get('message_id', '')}" if g["username"] else None,
                            "confidence": r.get("confidence", 0),
                            "pain_categories": r.get("pain_categories", []),
                            "reasoning": r.get("reasoning", ""),
                            "suggested_angle": r.get("suggested_angle", ""),
                        }
                        group_targets.append(target)
                        all_targets.append(target)

                found = len([r for r in results if r.get("is_target") and r.get("confidence", 0) >= 0.6])
                print(f"{found} targets")

                # Small delay to avoid rate limits
                await asyncio.sleep(0.5)

            group_stats[group_name] = {
                "messages_scanned": len(raw_messages),
                "targets_found": len(group_targets),
            }
            print(f"  Result: {len(raw_messages)} messages → {len(group_targets)} targets")

        except Exception as e:
            print(f"  ERROR: {e}")
            group_stats[group_name] = {"messages_scanned": 0, "targets_found": 0, "error": str(e)}

    # Step 3: Deduplicate and merge by user
    print(f"\n{'=' * 60}")
    print(f"  DEDUPLICATING & RANKING")
    print(f"{'=' * 60}")

    user_profiles = defaultdict(lambda: {
        "username": "",
        "full_name": "",
        "user_id": None,
        "messages": [],
        "all_categories": set(),
        "groups_seen_in": set(),
        "max_confidence": 0,
        "reasonings": [],
        "suggested_angles": [],
    })

    for t in all_targets:
        uid = t["user_id"]
        user_profiles[uid]["username"] = t["username"]
        user_profiles[uid]["full_name"] = t["full_name"]
        user_profiles[uid]["user_id"] = uid
        user_profiles[uid]["messages"].append({
            "text": t["message"],
            "group": t["group"],
            "date": t["date"],
            "link": t["message_link"],
        })
        user_profiles[uid]["all_categories"].update(t["pain_categories"])
        user_profiles[uid]["groups_seen_in"].add(t["group"])
        user_profiles[uid]["max_confidence"] = max(
            user_profiles[uid]["max_confidence"], t["confidence"]
        )
        if t["reasoning"]:
            user_profiles[uid]["reasonings"].append(t["reasoning"])
        if t["suggested_angle"]:
            user_profiles[uid]["suggested_angles"].append(t["suggested_angle"])

    # Score and rank
    ranked_targets = []
    for uid, profile in user_profiles.items():
        score = (
            profile["max_confidence"] * 10
            + len(profile["all_categories"]) * 3
            + len(profile["messages"]) * 2
            + len(profile["groups_seen_in"]) * 2
        )
        profile["score"] = round(score, 1)
        profile["all_categories"] = list(profile["all_categories"])
        profile["groups_seen_in"] = list(profile["groups_seen_in"])
        ranked_targets.append(profile)

    ranked_targets.sort(key=lambda x: x["score"], reverse=True)

    # Step 4: Output results
    print(f"\n{'=' * 60}")
    print(f"  RESULTS: {len(ranked_targets)} UNIQUE TARGETS")
    print(f"  LLM calls made: {total_llm_calls}")
    print(f"{'=' * 60}\n")

    top_n = min(20, len(ranked_targets))

    for i, target in enumerate(ranked_targets[:top_n], 1):
        print(f"{'─' * 55}")
        print(f"#{i} | @{target['username']} ({target['full_name']})")
        print(f"   Score: {target['score']} | Confidence: {target['max_confidence']}")
        print(f"   Pain: {', '.join(target['all_categories'])}")
        print(f"   Groups: {', '.join(target['groups_seen_in'])}")
        if target["reasonings"]:
            print(f"   Why: {target['reasonings'][0]}")
        if target["suggested_angles"]:
            print(f"   Pitch angle: {target['suggested_angles'][0]}")
        print(f"   Messages:")
        for msg in target["messages"][:2]:
            text = msg["text"][:120].replace("\n", " ")
            print(f"     [{msg['date']}] \"{text}\"")
        print()

    # Step 5: Generate personalized DMs for top 10
    print(f"\n{'=' * 60}")
    print(f"  GENERATING PERSONALIZED DMs (top 10)")
    print(f"{'=' * 60}\n")

    for i, target in enumerate(ranked_targets[:10], 1):
        print(f"Generating DM for @{target['username']}...", end=" ", flush=True)
        dm = await generate_dm(target)
        target["suggested_dm"] = dm
        print("done")
        print(f"\n  #{i} → @{target['username']}:")
        print(f"  {dm}")
        print()
        await asyncio.sleep(0.3)

    # Step 6: Save results
    output_file = os.path.join(os.path.dirname(__file__), "discovery_results.json")
    output = {
        "scan_date": datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
        "scan_range_days": SCAN_DAYS,
        "llm_model": "claude-haiku-4-5-20251001",
        "llm_calls": total_llm_calls,
        "group_stats": group_stats,
        "total_unique_targets": len(ranked_targets),
        "targets": ranked_targets[:50],
    }
    with open(output_file, "w") as f:
        json.dump(output, f, indent=2, default=str)

    print(f"\nResults saved to: {output_file}")
    print(f"\n{'=' * 60}")
    print(f"  NEXT STEPS")
    print(f"{'=' * 60}")
    print(f"  1. Review the top targets and DMs above")
    print(f"  2. Personalize the DMs slightly (add specific token names etc)")
    print(f"  3. Send 5 DMs today — start with the highest-scored targets")
    print(f"  4. Track responses in discovery_results.json")
    print(f"  5. Re-run in 2-3 days: python3 scan_groups.py")

    await client.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
