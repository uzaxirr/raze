# Spec: Raze Waitlist + Referral System

## Overview

Gated beta access via a waitlist with viral referral mechanics. Users get a taste of Raze's personality before full access. Every interaction funnels toward sharing.

---

## User Flows

### Flow 1: New User Discovers Raze (any entry point)

```
User opens @razeaii_bot (via raze.fun, referral link, or direct)
    │
    ▼
Bot checks: is this user in the waitlist table?
    ╱           ╲
  NO             YES
   │               │
   ▼               ▼
Create entry    Check status
Show welcome    ╱    │    ╲
               WAITING  APPROVED  BANNED
                 │        │         │
                 ▼        ▼         ▼
              Show     Unlock     Ignore
              position  Raze      message
```

### Flow 2: New User Joins

1. User sends any message or `/start` or `/start ref_ABC123`
2. Bot creates waitlist entry with unique referral code
3. Bot responds with Raze personality:

```
yo. raze here — your future crypto assistant. brutally honest, actually useful.

you're on the waitlist — #847 of 1,203

share your link to move up:
raze.fun/ref/K7xM2p

5 referrals = instant access. every referral = +50 spots.

oh and drop your email so i can ping you when you're in 👇
```

4. User sends email → bot validates and stores it
5. Bot confirms: "saved. now go share that link before someone else takes your spot"

### Flow 3: Waitlisted User Chats (Taste Mode)

Waitlisted users get **5 free messages per day** with the agent.

**Allowed:**
- Chat with Raze personality (banter, roasts)
- Token research (trending, overview, security)
- Sentiment/news queries
- Wallet analysis (if they share an address)
- .sol domain lookups

**Blocked (with CTA):**
- Swap tokens → "that's a pro move. you're still on the waitlist — share your link: raze.fun/ref/K7xM2p"
- Send SOL/tokens → same
- Set alerts/watchers → same
- Sniper workflow → same
- Wallet creation → not triggered until approved

**Rate limit:**
- 5 messages/day reset at midnight UTC
- After limit: "you've hit your daily limit. 5 free msgs/day while you're on the waitlist. share your link for instant access or wait til tomorrow"

### Flow 4: Wallet Address Roast (Hook)

User shares a wallet address or .sol domain while on waitlist:

1. Agent pulls portfolio (get_wallet_balance + get_token_balances)
2. Agent pulls recent transactions (get_recent_transactions)
3. Agent roasts their portfolio with personality
4. Ends with CTA:

```
damn. 45 SOL, bunch of dead memecoins, and 3 rug pulls this month.
your portfolio is a crime scene 💀

want me to watch it and ping you before the next rug?
oh wait... waitlist. share your link: raze.fun/ref/K7xM2p
```

### Flow 5: Referral Joins

1. Friend clicks `raze.fun/ref/K7xM2p` → landing page → "Join via Telegram" button
2. Opens `t.me/razeaii_bot?start=ref_K7xM2p`
3. Bot creates entry, credits referrer
4. Referrer gets notification:

```
someone used your link 🔥 +50 spots
you're now #198. 2 more referrals for instant access
```

5. If referrer hits 5 referrals → auto-approved:

```
you did it. 5 referrals. you're in.
say anything and let's get started 🫡
```

### Flow 6: User Gets Approved

Admin approves (batch or individual) OR user hits 5 referrals:

1. Bot sends notification:

```
you're in. welcome to raze.

say anything to get started. i'll set up your wallet
and we can start making moves.

fair warning: i will judge your trades 💀
```

2. Next message triggers the normal onboarding flow:
   - Auto-create Privy wallet
   - [FIRST_TIME_USER] flow
   - Trust question (internal vs external)
   - Portfolio wow moment (if external)
   - Set a hook (alert/watcher)

### Flow 7: Waitlist Card

User sends `/card` → bot generates a branded PNG:

```
┌──────────────────────────────────┐
│                                  │
│     🟣 raze — beta waitlist      │
│                                  │
│         [imp mascot]             │
│                                  │
│     @uzaxirr                     │
│     position: #47                │
│     referrals: 3                 │
│     status: almost there 🔥      │
│                                  │
│     ─────────────────────        │
│     raze.fun/ref/K7xM2p         │
│                                  │
│     "everything solana in        │
│      one chat"                   │
│                                  │
└──────────────────────────────────┘
```

- Top 50: gold border + "OG" badge
- Top 200: purple border + "early" badge
- Everyone else: standard dark theme
- Sent as a Telegram photo — easy to screenshot/share

---

## Database Schema

```sql
CREATE TABLE waitlist (
    id SERIAL PRIMARY KEY,
    telegram_user_id BIGINT UNIQUE NOT NULL,
    telegram_username VARCHAR(64),
    first_name VARCHAR(128),
    email VARCHAR(256),
    referral_code VARCHAR(8) UNIQUE NOT NULL,
    referred_by_code VARCHAR(8),
    referred_by_user_id BIGINT,
    position INTEGER NOT NULL,
    referral_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'waiting',      -- waiting | approved | active | banned
    messages_today INTEGER DEFAULT 0,
    messages_reset_at DATE DEFAULT CURRENT_DATE,
    daily_alpha_enabled BOOLEAN DEFAULT TRUE,
    wallet_address_shared VARCHAR(64),
    joined_via VARCHAR(20) DEFAULT 'direct',   -- direct | referral | website
    approved_at TIMESTAMP,
    activated_at TIMESTAMP,
    last_seen_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_waitlist_telegram_user ON waitlist(telegram_user_id);
CREATE INDEX idx_waitlist_referral_code ON waitlist(referral_code);
CREATE INDEX idx_waitlist_status ON waitlist(status);
CREATE INDEX idx_waitlist_position ON waitlist(position);
```

---

## Referral Mechanics

### Position Calculation

- New user joins → assigned position = current total waitlist count + 1
- Each referral → referrer moves up 50 spots: `new_position = max(1, current_position - 50)`
- 5 referrals → auto-approve (bypass queue entirely)
- Position of users between old and new position shift down by 1

### Referral Code Generation

- 8 character alphanumeric: `secrets.token_urlsafe(6)` → gives 8 chars
- Checked for uniqueness before insert
- Stored as-is, case-sensitive

### Anti-Gaming

- User can't refer themselves (same telegram_user_id check)
- Referred user must be NEW (not already on waitlist)
- Referral credit given only once per referred user
- No referral chains — only direct referrer gets credit

---

## Frontend: Referral Landing Page

### Route: `raze.fun/ref/[code]`

```
┌─────────────────────────────────────┐
│                                     │
│           🟣 raze                    │
│           [imp mascot]              │
│                                     │
│  "Everything Solana in one chat"    │
│                                     │
│  Your friend invited you to         │
│  skip the line.                     │
│                                     │
│  1,203 people waiting               │
│  247 already got access             │
│                                     │
│  ┌─────────────────────────────┐    │
│  │   Join Waitlist via Telegram │    │
│  └─────────────────────────────┘    │
│                                     │
│  What Raze does:                    │
│  • Trade Solana in one chat         │
│  • AI-powered token research        │
│  • Real-time whale tracking         │
│  • Savage crypto friend personality │
│                                     │
│  raze.fun — @razeaii_bot            │
│                                     │
└─────────────────────────────────────┘
```

**Button link:** `https://t.me/razeaii_bot?start=ref_{code}`

**API needed:** `GET /api/waitlist/stats` — returns `{total, approved, active}` for the page to show live numbers. No auth needed, public endpoint.

---

## Admin Bot (`@raze_admin_bot`)

Separate Telegram bot, restricted to your Telegram user ID only.

### Commands

```
/stats                  — total, waiting, approved, active, today's joins, viral coefficient
/top [n]                — top N referrers (default 10)
/approve [n]            — approve top N from queue (default 25)
/approve @username      — approve specific user
/ban @username          — remove from waitlist
/search @username       — look up user's waitlist info
/broadcast "message"    — send to all waitlisters (status=waiting)
/broadcast_approved "msg" — send to all approved users
/export                 — CSV export of full waitlist
/config                 — show current config values
/config REFERRAL_BOOST 50     — spots gained per referral
/config AUTO_APPROVE_REFS 5   — referrals needed for auto-approve
/config DAILY_MSG_LIMIT 5     — messages/day for taste mode
```

### Security

- Bot token: separate from @razeaii_bot
- Handler checks `update.effective_user.id == ADMIN_USER_ID` on every command
- All admin actions logged with timestamp

---

## Bot Code Changes

### Message Gating (core guard)

Every message handler wraps with this before anything else:

```python
async def check_access(telegram_user_id: int) -> dict:
    """
    Returns:
        {"access": "full"}           — approved/active user
        {"access": "taste", "remaining": 3}  — waitlisted, has messages left
        {"access": "limited"}        — waitlisted, daily limit hit
        {"access": "new"}            — not on waitlist yet
        {"access": "banned"}         — banned
    """
```

### Taste Mode Agent

When access is "taste", the agent gets a modified system prompt:

- Same personality
- Same tool access for READ operations
- Blocked tool access for WRITE operations (swap, send, alerts)
- Every 2-3 messages, agent naturally drops the referral CTA
- After limit: shows waitlist position + referral link

### Bot Commands (waitlist-specific)

```
/waitlist  — show position, referral count, link
/card      — generate and send waitlist card image
/refer     — show referral link + stats
/email     — set/update email
/mute      — opt out of daily alpha messages
```

### Existing Commands (gated)

```
/start     — joins waitlist or resumes session
/wallet    — blocked for waitlisted users ("get off the waitlist first")
/alerts    — blocked
/clear     — allowed (clears chat context)
/help      — shows waitlist-appropriate help
```

---

## Waitlist Card Generation

### Approach

SVG template with dynamic text → PNG via cairosvg. Same pattern discussed for PnL cards.

### Template Data

```python
{
    "username": "@uzaxirr",
    "position": 47,
    "referral_count": 3,
    "total_waitlist": 1203,
    "referral_code": "K7xM2p",
    "tier": "og" | "early" | "standard",  # based on position
    "status_text": "almost there 🔥",
}
```

### Tier Badges

- Position 1-50: Gold border, "OG" badge text
- Position 51-200: Purple border, "EARLY" badge text
- Position 201+: Dark theme, no badge

---

## Daily Alpha Messages

### What

One message per day to all waitlisted users with `daily_alpha_enabled=True`.

### When

Sent at ~9 AM UTC via a scheduled task (cron job or background worker).

### Content

Pulls from market-research MCP (trending topics) and formats with Raze personality:

```
daily alpha from raze 📊

$BONK up 42% today. whale just bought 50M tokens.
$WIF sentiment flipped bullish overnight.

you could be trading this right now. just saying.
share your link to get in faster: raze.fun/ref/K7xM2p

/mute to stop these
```

### Implementation

- Background task in the telegram-bot service
- Queries waitlist table for `status='waiting' AND daily_alpha_enabled=TRUE`
- Sends messages with rate limiting (Telegram allows ~30 msg/sec to different users)
- Tracks send failures, removes invalid chat_ids

---

## Edge Cases Covered

| Edge Case | Handling |
|---|---|
| User sends "hi" without /start | Bot checks waitlist → new user → auto-add to waitlist |
| User sends /start with no params | Same as above |
| User sends /start ref_INVALID | Joins without referral, bad code ignored |
| User refers themselves | Blocked (same telegram_user_id) |
| User tries to join twice | Idempotent, shows existing position |
| User deleted chat, comes back | Entry persists in DB, picks up where they left off |
| Referrer already has access | Referral still counts but referrer already in |
| Referred user already on waitlist | No duplicate, referrer doesn't get credit |
| User changes Telegram username | Tracked by telegram_user_id, not username |
| User approved while offline | Next message detects "approved" → unlocks |
| Admin approves already-active user | No-op |
| User hits message limit mid-conversation | Current message goes through, next one is blocked |
| User tries swap while on waitlist | Gets personality-driven denial + referral CTA |
| User shares wallet while on waitlist | Full portfolio analysis works (read-only) + referral CTA |
| 100 users join simultaneously | Positions assigned by insert timestamp |
| User sends email in wrong format | Bot validates with regex, asks again |
| User sends non-email when asked for email | Bot says "that doesn't look like an email" with personality |
| Daily alpha fails for one user | Logged, skipped, continues to next user |
| Admin bot receives message from non-admin | Silently ignored |

---

## Files to Create/Modify

### New Files

- `backend/db/models.py` — add `Waitlist` model
- `backend/db/alembic/versions/xxx_add_waitlist.py` — migration
- `backend/tg-bot/src/waitlist.py` — waitlist logic (CRUD, position calc, access check)
- `backend/tg-bot/src/waitlist_card.py` — SVG template + PNG generation
- `backend/tg-bot/src/daily_alpha.py` — daily message sender
- `frontend/src/app/ref/[code]/page.tsx` — referral landing page
- `frontend/src/app/api/waitlist/stats/route.ts` — public stats endpoint
- `backend/admin-bot/main.py` — admin bot (separate service)
- `backend/admin-bot/requirements.txt` — admin bot deps
- `backend/Dockerfile.admin` — admin bot Dockerfile

### Modified Files

- `backend/tg-bot/src/bot.py` — add waitlist gating, taste mode, new commands
- `backend/agent_prompt.py` — add taste mode variant for waitlisted users
- `CLAUDE.md` — document waitlist architecture

---

## Deployment

### Services

| Service | What |
|---|---|
| `telegram-bot` (existing) | Main bot with waitlist gating |
| `admin-bot` (new) | Admin commands, separate token |
| `frontend` (existing) | Referral landing page |
| `backend` (existing) | Agent + MCP servers |

### Environment Variables (new)

```
# Admin bot
ADMIN_BOT_TOKEN=xxx
ADMIN_USER_ID=1327643512

# Waitlist config
WAITLIST_REFERRAL_BOOST=50
WAITLIST_AUTO_APPROVE_REFS=5
WAITLIST_DAILY_MSG_LIMIT=5
WAITLIST_ENABLED=true
```

---

## Metrics to Track

- **Total signups** — how many joined the waitlist
- **Viral coefficient** — referrals per user (target: >1.0)
- **Conversion funnel** — joined → shared link → got referral → approved → active
- **Taste mode engagement** — messages/day per waitlisted user
- **Referral source** — direct vs referral vs website
- **Time to access** — average days on waitlist before approval
- **Drop-off** — approved but never came back
- **Top referrers** — leaderboard for internal tracking
- **Daily alpha engagement** — open rate, mute rate

---

## Launch Sequence

1. **Build** — waitlist table, bot gating, taste mode, referral page, admin bot, card generation
2. **Test** — full flow locally with test accounts
3. **Deploy** — all services to Railway
4. **Seed** — give 10-20 friends/mutuals early referral links
5. **Announce** — tweet: "raze beta is live. waitlist open. raze.fun"
6. **Approve in waves** — 25/day first week, increase as infra holds
7. **Monitor** — viral coefficient, taste mode usage, conversion
8. **Iterate** — adjust referral rewards, message limits, approval pace
