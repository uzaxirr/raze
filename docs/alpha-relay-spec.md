# Alpha Relay — KOL Monitoring + Validated Alpha Broadcasting

> Spec written April 2026. Status: planned. Priority: high — this is the feature that makes Raze indispensable.

## One-Line Summary

Monitor KOL channels, auto-validate every token call with on-chain data, broadcast enriched alpha to Raze users in real-time.

---

## The Problem

1. KOL drops a token call in Telegram/X
2. Trader sees it (if they're even online)
3. Trader manually checks RugCheck, Birdeye, BubbleMaps, DexScreener (10 min)
4. By the time they finish researching, the pump is over
5. If they skip the research, they get rugged (98.7% of pump.fun tokens are rugs)

**Nobody validates KOL calls with on-chain data in real-time.** Alpha groups give you the call. Trading bots give you the execution. The trust layer between them doesn't exist.

## The Solution

Raze becomes the trust layer:

```
KOL calls $TOKEN → Raze validates in 4 seconds → User gets enriched alert → one-tap to trade
```

---

## Technical Architecture

```
MONITOR → FILTER → VALIDATE → BROADCAST
```

### Layer 1: Monitoring Service

**What it does:** Listens to KOL channels/accounts for token mentions and trade signals.

**Telegram (Phase 1):**
- Tech: Telethon (Python) — joins public channels as a user account
- Detects: Solana contract addresses (base58, 32-44 chars), token symbols ($TOKEN), buy/sell language
- Real-time: message stream, sub-second latency
- Cost: free

**Twitter/X (Phase 2):**
- Tech: Twitter API Basic ($100/mo) — filtered stream or polling
- Detects: same patterns as Telegram
- Latency: 30-60 second polling or real-time stream

**What to monitor:**
- 10-20 public Telegram alpha channels
- 10-20 X accounts (alpha callers, whale watchers)
- Expandable — users could eventually add their own channels to monitor

**Detection patterns:**
- Contract address regex: `[1-9A-HJ-NP-Za-km-z]{32,44}` (Solana base58)
- Token mention: `$[A-Z]{2,10}` pattern
- Buy signals: "just bought", "aping", "loaded up", "entry", "buying"
- Sell signals: "sold", "dumping", "taking profit", "exiting"
- Alert signals: "dev wallet", "rug", "bundled", "LP removed"

### Layer 2: Filter (Small LLM — Haiku)

**What it does:** Classifies each detected message as actionable alpha or noise. Fast and cheap — $0.25/1M tokens.

**Filters OUT:**
- General commentary ("solana is the future")
- Memes, jokes, shitposts
- Old news / already known
- Engagement farming ("what should I buy?")
- Retweets of calls older than 30 min

**Passes THROUGH:**
- Token calls with CA ("aping $TOKEN 7xKk...")
- Buy/sell signals ("just loaded up on $X")
- Whale alerts ("toly just moved 500 SOL")
- Risk warnings ("dev is dumping $Y")

**Output schema:**
```json
{
  "relevant": true,
  "token_address": "7xKk...",
  "token_symbol": "$TOKEN",
  "action": "buy_call",
  "urgency": "high",
  "context": "KOL said: 'aping into $TOKEN, dev is based, chart looks clean'",
  "confidence": 0.85
}
```

**Urgency classification:**
- **HIGH** — KOL confirmed buy, token < 30 min old, has CA → send immediately
- **MEDIUM** — KOL mentioned bullish, token exists, worth researching → send within 5 min
- **LOW** — general sentiment, no specific action → batch in daily digest

### Layer 3: Validate (Raze's Existing Tools)

**What it does:** Runs the full Raze research pipeline on the detected token. All calls in parallel for speed.

**Validation checks (parallel):**
1. **Security scan** — mint authority, freeze authority, LP burned/locked, honeypot check
2. **Token data** — price, market cap, volume, liquidity, FDV (Birdeye)
3. **Holder analysis** — top 10 concentration, distribution, dev wallet holdings
4. **Bundle detection** — coordinated buys at launch
5. **Whale activity** — smart money inflow/outflow (Helius)
6. **Social sentiment** — LunarCrush buzz score, trending status
7. **KOL track record** — this specific KOL's historical accuracy (from our DB)

**Output: enriched signal with trust score**
```json
{
  "token": "$TOKEN",
  "security_score": "7/8",
  "security_flags": ["mint_revoked", "lp_burned", "no_freeze", "no_bundles"],
  "risk_flags": ["low_liquidity_18k", "top_holder_31%"],
  "kol_accuracy": "67%",
  "kol_total_calls": 42,
  "market_cap": "$204K",
  "liquidity": "$18K",
  "volume_24h": "$890K",
  "sentiment": "bullish (78/100)",
  "trust_score": 6.5,
  "verdict": "clean contract but thin liquidity. KOL has mediocre track record. small size only."
}
```

### Layer 4: Broadcast (Raze Agent → Users)

**What it does:** Sends the validated alpha to subscribed users in Raze's voice.

**Message format:**
```
alpha from @blknoiz06 (hit rate: 67%)

$TOKEN — just called.

raze's scan:
security: 7/8 ✅ mint revoked, lp burned
but: $18k liquidity, top wallet 31%
sentiment: bullish, 4.2k mentions/24h

verdict: clean contract, thin liquidity. small size or skip.

reply "swap 1 SOL to $TOKEN" to ape
reply "watch $TOKEN" for price alert
reply "pass" to skip
```

**Broadcast channels:**
- Telegram DM to subscribed users (primary)
- Telegram group broadcast (future — group chat mode)
- X post via Postiz (curated best signals only)

**User actions after receiving alert:**
- "swap 1 SOL to $TOKEN" → instant Jupiter swap via Raze
- "watch $TOKEN" → price alert set
- "pass" → logged, no action
- Each action = potential revenue (2% swap fee)

---

## KOL Scoring System

### How it works

Track every KOL's calls in the database. After time passes, check outcomes.

**Scoring timeline:**
- After 1 hour: did token pump >20% from call price?
- After 24 hours: is token up or down from call price?
- After 7 days: final outcome classification

**Outcome categories:**
- **HIT** — token up >20% after 24h from call price
- **MISS** — token down >20% after 24h
- **FLAT** — within ±20% after 24h
- **RUG** — token dropped >80% or LP removed

**KOL accuracy = hits / (hits + misses + rugs)**

Flat outcomes are excluded from accuracy calc (neutral).

**KOL tiers (displayed to users):**
- 🟢 **Trusted** — >70% accuracy, >20 calls tracked
- 🟡 **Mixed** — 40-70% accuracy or <20 calls tracked
- 🔴 **Risky** — <40% accuracy
- ⚪ **New** — <5 calls tracked, no rating yet

### Why this matters

1. Users can filter alerts by KOL quality
2. Raze can auto-mute low-quality KOLs
3. KOL accuracy data itself is alpha — "this caller rugs 60% of the time"
4. Creates a moat — this data compounds over time and competitors can't replicate it

---

## Deduplication / Convergence Detection

### Multiple KOLs calling the same token = stronger signal

**How it works:**
- When a token is called, check if other KOLs called it in the last 2 hours
- If 3+ independent KOLs call the same token → **CONVERGENCE SIGNAL**
- This gets special treatment in the broadcast:

```
🔥 convergence alert — 3 KOLs called $TOKEN in 47 minutes

@blknoiz06 (67% accuracy) — "aping heavy"
@degen_mike (54% accuracy) — "chart looks clean"
@whale_watcher (72% accuracy) — "smart money flowing in"

raze's scan: security 8/8, $340K liquidity, clean holders.
combined smart money inflow: $119K in last hour.

this is the kind of signal people pay $500/mo alpha groups for.

reply "swap" to ape, "watch" for alerts
```

**Dedup rules:**
- Same token + same KOL within 2h = ignore duplicate
- Same token + different KOL within 2h = convergence
- Same token called >5 times in 1h = might be coordinated shill, flag as suspicious

---

## Database Schema

### New tables (in main Raze PostgreSQL)

```sql
-- KOL profiles
CREATE TABLE kol_profiles (
    id SERIAL PRIMARY KEY,
    handle VARCHAR(128) NOT NULL,
    platform VARCHAR(20) NOT NULL, -- telegram, x
    display_name VARCHAR(256),
    channel_id VARCHAR(128), -- telegram channel ID or X user ID
    followers INTEGER DEFAULT 0,
    total_calls INTEGER DEFAULT 0,
    successful_calls INTEGER DEFAULT 0,
    accuracy_pct FLOAT DEFAULT 0,
    tier VARCHAR(20) DEFAULT 'new', -- trusted, mixed, risky, new
    is_active BOOLEAN DEFAULT TRUE,
    last_call_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(handle, platform)
);

-- Individual KOL calls
CREATE TABLE kol_calls (
    id SERIAL PRIMARY KEY,
    kol_id INTEGER REFERENCES kol_profiles(id),
    token_address VARCHAR(64) NOT NULL,
    token_symbol VARCHAR(32),
    call_type VARCHAR(20) NOT NULL, -- buy, sell, alert, warning
    message_text TEXT,
    call_price NUMERIC(24, 12),
    price_1h_after NUMERIC(24, 12),
    price_24h_after NUMERIC(24, 12),
    price_7d_after NUMERIC(24, 12),
    outcome VARCHAR(20), -- hit, miss, flat, rug (set by background job)
    security_score INTEGER,
    validation_result JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Alpha signals (filtered + validated, ready for broadcast)
CREATE TABLE alpha_signals (
    id SERIAL PRIMARY KEY,
    kol_id INTEGER REFERENCES kol_profiles(id),
    token_address VARCHAR(64) NOT NULL,
    token_symbol VARCHAR(32),
    raw_message TEXT,
    urgency VARCHAR(10) NOT NULL, -- high, medium, low
    filter_confidence FLOAT,
    validation_result JSONB, -- full validation output
    trust_score FLOAT,
    is_convergence BOOLEAN DEFAULT FALSE,
    convergence_count INTEGER DEFAULT 1,
    broadcast_sent BOOLEAN DEFAULT FALSE,
    broadcast_at TIMESTAMP,
    broadcast_count INTEGER DEFAULT 0, -- how many users received it
    user_actions JSONB, -- {"swaps": 3, "watches": 7, "passes": 12}
    created_at TIMESTAMP DEFAULT NOW()
);

-- User subscriptions to alpha relay
CREATE TABLE alpha_subscriptions (
    id SERIAL PRIMARY KEY,
    telegram_user_id BIGINT NOT NULL,
    min_urgency VARCHAR(10) DEFAULT 'medium', -- high, medium, low
    min_kol_tier VARCHAR(20) DEFAULT 'mixed', -- trusted, mixed, risky, new
    convergence_only BOOLEAN DEFAULT FALSE, -- only send convergence signals
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(telegram_user_id)
);
```

---

## Build Phases

### Phase 1: Telegram Monitor + Basic Pipeline (1 week)
- Telethon listener for 5-10 public channels
- Haiku filter for relevance classification
- Security scan + token data validation
- Broadcast to founder only (testing)
- Basic KOL profiles table

### Phase 2: KOL Scoring + Convergence (1 week)
- Background job to check call outcomes after 1h/24h/7d
- KOL accuracy calculation
- Convergence detection (multi-KOL same token)
- Broadcast to beta users (waitlist approved)

### Phase 3: User Subscriptions + Actions (1 week)
- Users can subscribe/unsubscribe to alpha relay
- Filter by urgency and KOL tier
- One-tap swap from the alert message
- Track user actions per signal

### Phase 4: X Monitoring (when budget allows)
- Twitter API Basic ($100/mo) for KOL account monitoring
- Same pipeline: monitor → filter → validate → broadcast
- Cross-platform convergence (same token called on both TG and X)

---

## Revenue Impact

Every alpha signal that leads to a swap = revenue:
- 2% swap fee on every trade triggered by an alpha alert
- If 100 users subscribe, 20% act on each signal, average 2 SOL swap:
  - 20 swaps × $300 avg × 2% = $120 per signal
  - 5 signals/day × $120 = $600/day potential

Alpha relay could become Raze's primary revenue driver, not just swap fees from manual usage.

---

## What Makes This Different

| Feature | Alpha Groups ($200/mo) | Telegram Bots | Raze Alpha Relay |
|---------|----------------------|---------------|-----------------|
| KOL calls | ✓ (raw) | — | ✓ (validated) |
| Security scan | — | — | ✓ (auto) |
| On-chain validation | — | — | ✓ (auto) |
| KOL accuracy tracking | — | — | ✓ |
| Convergence detection | — | — | ✓ |
| One-tap execution | — | ✓ (swap only) | ✓ (scan + swap) |
| Trust score | — | — | ✓ |
| Cost | $200/mo | free | free (fees on swaps) |

**The positioning:** "raze doesn't just tell you what KOLs are calling. it tells you if they're right."

---

## Open Questions

1. Which 10 Telegram channels to monitor first?
2. Spare Telegram user account for Telethon monitoring?
3. Build in main raze backend or separate microservice?
4. Premium feature (subscription) or free (drive swap volume)?
5. How aggressive on broadcasting? Every signal or only high-urgency?

---

## Dependencies

- Telethon Python library (Telegram monitoring)
- Claude Haiku API (filter LLM)
- Existing Raze MCP tools (validation)
- PostgreSQL (KOL database)
- Twitter API Basic — $100/mo (Phase 4)
- Background job scheduler (outcome tracking)
