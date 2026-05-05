# Raze Wallet Context Architecture — Real-Time Portfolio Awareness

## For Reviewing Agents

You are reviewing the proposed architecture for giving Raze's AI agent **real-time knowledge of the user's wallet portfolio, balances, and recent transactions**. The goal is to make the agent behave like a trading terminal — always aware of the user's financial state without needing to be asked.

**Context:** Raze is a Solana AI trading agent inside Telegram (@razeaii_bot). Users chat with it to swap tokens, send SOL, research wallets, etc. The agent uses MCP (Model Context Protocol) tools to query the blockchain.

---

## 1. The Problem

### Current State: The Agent Is Blind

Right now, the agent has **zero persistent awareness** of the user's wallet. Every conversation starts from scratch. The agent only knows what it fetches on-demand when the user explicitly asks.

**Current flow:**
```
User: "check my balance"
  → Agent calls get_wallet_balance() MCP tool
  → Waits 1-2 seconds for RPC response
  → "you have 0.034 SOL"

User: "did my swap go through?"
  → Agent has no idea. It wasn't watching.
  → "let me check... " → calls get_recent_transactions()
  → Waits 2-3 seconds
  → "yeah, looks like it went through"

User: "swap all my USDC to SOL"
  → Agent doesn't know how much USDC the user has
  → Calls get_token_balances() first
  → Waits 1-2 seconds
  → Then builds the swap
```

### What's Wrong With This

1. **Latency:** Every wallet-related question requires 1-3 RPC calls before the agent can respond. Each call adds 500ms-2s.
2. **No memory between turns:** The agent forgets the balance it just fetched. Next message, it has to fetch again.
3. **No proactive awareness:** The agent can't say "hey, your SOL is up 15% since yesterday" because it never tracks state.
4. **No transaction awareness:** When the user signs a transaction via the signing page, the agent doesn't know it happened. The confirmation comes as a direct Telegram message, not through the agent's conversation.
5. **Duplicate tool calls:** The agent frequently calls balance tools redundantly — it already checked 30 seconds ago but doesn't remember.

### Impact on User Experience

The agent feels **reactive and slow** instead of **proactive and intelligent**. A good trading terminal always shows your current positions, P&L, and recent activity. Our agent has to be asked for each piece of information separately.

---

## 2. Current Architecture

### How the Agent Gets Wallet Data Today

The agent has access to these MCP tools via the `read-mcp` server:

**`get_wallet_balance(wallet_address, network)`** — SOL balance only
```python
# Returns:
{
    "wallet": "D4M5...",
    "sol": 0.034,
    "lamports": 34000000,
    "formatted": "0.0340 SOL"
}
```

**`get_token_balances(wallet_address, network)`** — All SPL tokens
```python
# Returns:
{
    "wallet": "D4M5...",
    "tokens": [
        {"mint": "EPjFWdd5...", "symbol": "USDC", "balance": 3.73, "decimals": 6},
        {"mint": "DezXAZ...", "symbol": "BONK", "balance": 1234567.0, "decimals": 5}
    ],
    "count": 2
}
```

**`get_recent_transactions(wallet_address, limit, network)`** — Recent tx signatures + parsed details
```python
# Returns parsed transaction list with type, amounts, counterparties
```

**`get_wallet_pnl(wallet_address)`** — Portfolio with USD values (via Birdeye API)
```python
# Returns token holdings with USD values, sorted by last trade
```

### How These Tools Are Called

The agent decides when to call tools based on the user's message. The LLM reads the conversation and chooses which tools to invoke. There is **no automatic pre-fetching** — the agent must decide to call these tools.

### What the Agent Sees in Context

Before each message, the agent receives this session_state:

```python
# bot.py line 1511-1521
session_state = {
    "wallet_address": user_profile.wallet_address,        # Privy internal wallet
    "wallet_id": user_profile.wallet_id,
    "telegram_username": user_profile.telegram_username,
    "telegram_user_id": user_id,
    "solana_network": "mainnet",
    "signing_mode": "internal",                            # or "external"
    "external_wallet_address": user_profile.external_wallet_address,
    "preferred_wallet_app": "phantom",
    "message_sent_at": "2026-04-22 00:15:00 UTC",
}
```

And this system prompt header:

```
You are Chatting with {telegram_username}.
Their internal (Privy) wallet: {wallet_address}
Their signing mode: {signing_mode}
Their external wallet: {external_wallet_address}
...
```

**Notice what's missing:** No balances. No token holdings. No recent transactions. No USD values. The agent starts every conversation completely blind to the user's financial state.

### Current Database Schema (Single Wallet)

```python
class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True)
    telegram_user_id = Column(BigInteger, unique=True, index=True)
    telegram_username = Column(String(255))
    wallet_address = Column(String(64))          # Single internal wallet
    wallet_id = Column(String(64))               # Privy wallet ID
    signing_mode = Column(String(20), default="internal")
    external_wallet_address = Column(String(64))  # Single external wallet
    preferred_wallet_app = Column(String(20), default="phantom")
```

**Limitation:** Only supports 1 internal + 1 external wallet per user.

### Existing Webhook Infrastructure

We already have a Helius webhook receiver service (`backend/services/webhook_receiver/`) that:
- Receives transaction webhooks from Helius at `POST /webhook/helius`
- Looks up users who are **watching** specific wallets (via `wallet_alerts` table)
- Sends Telegram notifications when watched wallets have activity

This infrastructure currently serves the "wallet tracking" feature (watch other people's wallets), NOT the user's own wallet monitoring. But the same infrastructure can be extended.

```python
# Existing webhook receiver — services/webhook_receiver/server.py
@app.post("/webhook/helius")
async def receive_helius_webhook(request, authorization):
    transactions = await request.json()
    for tx_data in transactions:
        tx = HeliusTransaction(**tx_data)
        accounts = extract_accounts(tx)
        # Find users watching these accounts
        watchers = db.query(WalletAlert).filter(
            WalletAlert.watched_wallet.in_(accounts),
            WalletAlert.is_active == True
        ).all()
        # Send notifications
        for alert in watchers:
            await send_notification(user_id=alert.user_id, ...)
```

### Existing Environment

- **Helius:** API key configured, RPC endpoint set up
- **Webhook receiver:** Running on Railway at port 8010
- **Database:** PostgreSQL on Railway (already has user_profiles, wallet_alerts, etc.)
- **Agent framework:** Agno AI with Claude Sonnet 4

---

## 3. What We Want Instead

### Vision: Trading Terminal in the Agent's Head

Every time the user sends a message, the agent should already know:

```
[WALLET CONTEXT — updated 2s ago]
📊 Portfolio: $47.23 (+2.1% today)

Internal (Privy) D4M5...YqpJ:
  SOL: 0.034 ($2.97) | USDC: 3.73 ($3.73)

External (Phantom) Cu5r...jMHN:
  SOL: 0.5 ($43.50) | BONK: 1.2M ($12.40)

Recent:
  • 2min ago: ✅ swap 1 USDC → 0.012 SOL (via sign page)
  • 15min ago: received 5 USDC from 7xK3...
  • 1hr ago: swap 0.5 SOL → 42.5 USDC

Pending: none
```

The agent can then respond contextually:

```
User: "gm"
Agent: "gm. portfolio at $47, sol looking decent today.
        that usdc→sol swap from earlier is already up 2%.
        finally timing something right?"

User: "swap all my usdc"
Agent: "3.73 USDC → SOL. that's like 0.043 sol.
        sure you wanna mass your wealth around like that?"
        [builds swap immediately, no tool call needed for balance]

User: "did my swap go through?"
Agent: "yeah 2 minutes ago. 1 USDC → 0.012 SOL.
        already confirmed on-chain. you're welcome."
```

### Multi-Wallet Support

Future state: users can connect multiple external wallets.

```
User: "add my backpack wallet"
  → Shares address
  → Agent: "added. want me to name it 'backpack' or something else?"

User: "check all my wallets"
  → Agent already knows all balances from context injection
  → "phantom: $43.50 | backpack: $892.10 | privy: $3.73
     total: $939.33. almost four figures. exciting times."
```

---

## 4. Proposed Architecture

### Three-Tier Implementation

#### Tier 1: Fetch-on-message (start here, simple)

Before each agent call in `bot.py`, fetch wallet data and inject into context.

```python
# bot.py — before calling the agent
async def fetch_wallet_context(wallet_address: str, external_address: str = None) -> str:
    """Fetch wallet snapshot and format as context string."""
    import httpx

    helius_url = f"https://mainnet.helius-rpc.com/?api-key={HELIUS_API_KEY}"

    async with httpx.AsyncClient(timeout=5) as client:
        # Parallel fetch: SOL balance + token accounts + recent txs
        sol_task = client.post(helius_url, json={
            "jsonrpc": "2.0", "id": 1,
            "method": "getBalance",
            "params": [wallet_address]
        })
        tokens_task = client.post(helius_url, json={
            "jsonrpc": "2.0", "id": 2,
            "method": "getTokenAccountsByOwner",
            "params": [wallet_address,
                {"programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"},
                {"encoding": "jsonParsed"}]
        })
        txs_task = client.post(helius_url, json={
            "jsonrpc": "2.0", "id": 3,
            "method": "getSignaturesForAddress",
            "params": [wallet_address, {"limit": 5}]
        })

        sol_resp, tokens_resp, txs_resp = await asyncio.gather(
            sol_task, tokens_task, txs_task
        )

    # Format into compact context string
    sol_balance = sol_resp.json()["result"]["value"] / 1e9
    # ... parse tokens and txs ...

    return f"""[WALLET: {wallet_address[:8]}...]
SOL: {sol_balance:.4f} | {token_summary}
Last: {tx_summary}"""

# Inject into session_state before agent call
wallet_context = await fetch_wallet_context(
    user_profile.wallet_address,
    user_profile.external_wallet_address
)
session_state["wallet_context"] = wallet_context
```

Then update the agent prompt to use it:

```python
# agent_prompt.py — add to system prompt
"""
{wallet_context}
"""
```

**Pros:** Simple, always fresh, ~20 lines of code
**Cons:** Adds 300-500ms latency per message (parallel Helius calls), RPC costs scale with messages

#### Tier 2: Cached snapshots (reduce latency)

Store wallet snapshots in PostgreSQL. Refresh on message if stale (>30s).

```sql
CREATE TABLE wallet_snapshots (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(64) NOT NULL UNIQUE,
    user_id BIGINT REFERENCES user_profiles(telegram_user_id),

    -- Cached data
    sol_balance NUMERIC(24,12),
    sol_usd NUMERIC(12,2),
    total_usd NUMERIC(12,2),
    tokens JSONB,            -- [{symbol, mint, balance, usd}, ...]
    recent_txs JSONB,        -- [{type, signature, amount, token, time}, ...]

    -- Freshness
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    update_source VARCHAR(20)  -- "message" | "webhook" | "poll"
);
```

```python
# bot.py — check cache, refresh if stale
snapshot = db.query(WalletSnapshot).filter_by(wallet_address=addr).first()
if not snapshot or (now - snapshot.updated_at).seconds > 30:
    # Refresh from RPC
    fresh_data = await fetch_wallet_data(addr)
    snapshot.update(fresh_data)
    db.commit()

# Inject cached snapshot (0ms if fresh)
session_state["wallet_context"] = format_snapshot(snapshot)
```

**Pros:** Zero latency for cached data, reduces RPC calls by ~90%
**Cons:** Data can be up to 30s stale, needs DB schema

#### Tier 3: Helius webhooks (real-time push)

Register each user's wallets with Helius webhooks. On any wallet activity, Helius pushes to our webhook receiver, which updates the snapshot immediately.

```python
# Extend existing webhook_receiver/server.py
@app.post("/webhook/helius")
async def receive_helius_webhook(request, authorization):
    transactions = await request.json()
    for tx_data in transactions:
        tx = HeliusTransaction(**tx_data)
        accounts = extract_accounts(tx)

        # EXISTING: notify wallet watchers
        watchers = db.query(WalletAlert).filter(...)
        for alert in watchers:
            await send_notification(...)

        # NEW: update wallet snapshots for user's OWN wallets
        own_wallets = db.query(UserWallet).filter(
            UserWallet.address.in_(accounts)
        ).all()
        for wallet in own_wallets:
            await refresh_wallet_snapshot(wallet.address)
            # Snapshot is now fresh for next agent message
```

Register wallets with Helius when users add them:

```python
async def register_wallet_webhook(wallet_address: str):
    """Add wallet to Helius webhook monitoring."""
    async with httpx.AsyncClient() as client:
        # Use Helius API to add address to existing webhook
        await client.put(
            f"https://api.helius.xyz/v0/webhooks/{WEBHOOK_ID}",
            params={"api-key": HELIUS_API_KEY},
            json={
                "webhookURL": f"{WEBHOOK_RECEIVER_URL}/webhook/helius",
                "accountAddresses": [wallet_address],
                "transactionTypes": ["SWAP", "TRANSFER", "ANY"],
            }
        )
```

**Pros:** Real-time (sub-second), zero per-message RPC cost, scales with activity not messages
**Cons:** More infrastructure, webhook registration management, Helius webhook limits

---

## 5. Multi-Wallet Database Schema

```sql
-- Replace single wallet fields in user_profiles with a proper wallets table
CREATE TABLE user_wallets (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES user_profiles(telegram_user_id) NOT NULL,
    address VARCHAR(64) NOT NULL,
    label VARCHAR(64),                -- "phantom", "backpack", "trading", custom name
    wallet_type VARCHAR(20) NOT NULL, -- "internal" | "external"
    wallet_id VARCHAR(64),            -- Privy wallet ID (for internal only)
    is_default BOOLEAN DEFAULT false, -- default for transactions
    is_active BOOLEAN DEFAULT true,
    added_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, address)
);

-- Cached wallet snapshots (updated by webhooks or on-demand)
CREATE TABLE wallet_snapshots (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(64) NOT NULL UNIQUE,

    -- Balances
    sol_balance NUMERIC(24,12),
    sol_usd NUMERIC(12,2),
    total_usd NUMERIC(12,2),
    tokens JSONB,               -- [{symbol, mint, balance, usd, pnl_pct}, ...]

    -- Recent activity
    recent_txs JSONB,           -- [{type, sig, amount, token, counterparty, time, status}, ...]

    -- Freshness tracking
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    update_source VARCHAR(20),  -- "webhook" | "message" | "poll" | "manual"

    -- Helius webhook tracking
    webhook_registered BOOLEAN DEFAULT false,
    webhook_registered_at TIMESTAMPTZ
);

-- Index for fast user→wallets→snapshots lookup
CREATE INDEX idx_user_wallets_user ON user_wallets(user_id);
CREATE INDEX idx_wallet_snapshots_updated ON wallet_snapshots(updated_at);
```

### Migration Path from Single to Multi-Wallet

```sql
-- Migrate existing wallet data to user_wallets table
INSERT INTO user_wallets (user_id, address, label, wallet_type, wallet_id, is_default)
SELECT telegram_user_id, wallet_address, 'internal', 'internal', wallet_id, true
FROM user_profiles WHERE wallet_address IS NOT NULL;

INSERT INTO user_wallets (user_id, address, label, wallet_type, is_default)
SELECT telegram_user_id, external_wallet_address, 'external', 'external', false
FROM user_profiles WHERE external_wallet_address IS NOT NULL;
```

---

## 6. Context Injection Format

### What the Agent Sees (injected before every message)

```
[WALLET CONTEXT — refreshed 3s ago]
Portfolio: $145.47 across 2 wallets

phantom (D4M5...YqpJ) — default:
  SOL: 0.034 ($2.97) | USDC: 3.73 ($3.73) | BONK: 1.2M ($12.40)
  Total: $19.10
  Last: swap 1 USDC → 0.012 SOL ✅ 2min ago

backpack (Cu5r...jMHN):
  SOL: 1.5 ($126.37)
  Total: $126.37
  Last: received 2 SOL from 7xK3... 1hr ago

Recent across all:
  • 2min ago: swap 1 USDC → 0.012 SOL (phantom) ✅
  • 15min ago: received 5 USDC (phantom)
  • 1hr ago: received 2 SOL (backpack)

Pending sign sessions: none
```

### Token Budget Considerations

This context block is ~200-300 tokens. The agent's system prompt is ~500 tokens. Total overhead: ~800 tokens per message.

At Claude Sonnet pricing (~$3/M input tokens), 10,000 messages/day = ~$24/day overhead. Acceptable for the UX gain.

For users with many wallets/tokens, truncate to top 5 tokens by USD value and last 3 transactions.

---

## 7. Agent Behavior Changes

### With wallet context, the agent can:

| Scenario | Without context | With context |
|---|---|---|
| "gm" | "gm" (no context) | "gm. portfolio at $145. sol looking good today" |
| "swap all my usdc" | Calls get_token_balances first (1-2s delay) | Knows 3.73 USDC instantly, builds swap |
| "did my swap go through?" | Doesn't know, must call tools | "yeah, 2 min ago. 1 USDC → 0.012 SOL. confirmed" |
| "am I making money?" | Calls get_wallet_pnl (2-3s) | "phantom up 2.1% today. backpack flat. you're fine" |
| "what should I do?" | Generic advice | "you're heavy on SOL (87% of portfolio). maybe diversify?" |
| User returns after signing | No idea tx happened | "saw you signed that swap. 1 USDC → SOL. already up 0.3%" |

### How it connects to the signing flow

When a user signs a transaction via the signing page (`raze.fun/sign/{id}`):
1. Backend confirms the tx and notifies Telegram
2. **With Tier 3 (webhooks):** Helius webhook fires → updates wallet snapshot → next message, agent sees the new balance and the completed tx in context
3. Agent can respond contextually: "nice, swap landed. you now have 0.046 SOL"

---

## 8. Scale Considerations

### RPC Cost at Scale

| Tier | Users | Wallets | Messages/day | RPC calls/day | Helius cost |
|---|---|---|---|---|---|
| Tier 1 (fetch every msg) | 10 | 20 | 100 | 6,000 | Free tier |
| Tier 1 | 1,000 | 3,000 | 10,000 | 900,000 | ~$50/mo |
| Tier 1 | 10,000 | 30,000 | 100,000 | 9,000,000 | ~$500/mo |
| Tier 2 (cached 30s) | 10,000 | 30,000 | 100,000 | ~900,000 | ~$50/mo |
| Tier 3 (webhooks) | 10,000 | 30,000 | 100,000 | ~200,000 (activity only) | ~$20/mo |

**Tier 3 scales with wallet ACTIVITY, not with user MESSAGES.** This is critical — most messages don't involve wallet changes, so why re-fetch?

### Helius Webhook Limits

- Free plan: 2 webhooks, 100K events/month
- Growth plan: 25 webhooks, 2M events/month
- Business plan: unlimited webhooks

For multi-wallet at scale, we'd need the Growth or Business plan. One webhook can monitor multiple addresses (Helius supports bulk address lists per webhook).

### Database Load

`wallet_snapshots` table with 30,000 rows (one per wallet) is trivial for PostgreSQL. The main load is writes from webhook updates — at peak, maybe 100 writes/second which PostgreSQL handles easily.

---

## 9. Implementation Plan

### Phase 1: Tier 1 + Single Wallet (do now, ~1 day)
1. Add `fetch_wallet_context()` function to bot.py
2. Call it before each agent invocation with parallel Helius RPC calls
3. Inject result into `session_state["wallet_context"]`
4. Update agent prompt to display it
5. Test end-to-end

### Phase 2: Multi-Wallet Database (~2 days)
1. Add `user_wallets` + `wallet_snapshots` tables
2. Migrate existing single-wallet data
3. Add `/addwallet`, `/wallets`, `/removewallet` bot commands
4. Update context injection to loop over all wallets
5. Agent can ask "which wallet?" when ambiguous

### Phase 3: Cached Snapshots (~1 day)
1. Store fetched data in `wallet_snapshots` table
2. Only re-fetch if snapshot is >30 seconds old
3. Reduces RPC calls by ~90%

### Phase 4: Helius Webhooks (~2 days)
1. Register user wallets with Helius webhook on add
2. Extend webhook receiver to update `wallet_snapshots`
3. Snapshots are always fresh — zero per-message RPC cost
4. Deregister wallets on remove

### Phase 5: Smart Context (~1 day)
1. Don't dump ALL wallet data — truncate to relevant info
2. Top 5 tokens by USD value
3. Last 3 transactions
4. Highlight changes since last message ("BONK +15% since we last talked")
5. Token-level P&L tracking

---

## 10. Questions for Review

### Architecture
1. Is the three-tier approach (fetch → cache → webhook) the right incremental path? Or should we skip to webhooks from the start?
2. Should wallet context be injected into `session_state` (Agno's built-in context) or as a separate system message prefix? What's better for the LLM's attention?
3. How should we handle context for users with 10+ wallets and 50+ tokens? Truncation strategy?

### Multi-Wallet
4. Is a separate `user_wallets` table the right design, or should we use a JSONB column on `user_profiles`?
5. How should the agent handle multi-wallet ambiguity? (e.g., "swap my SOL" when they have SOL in 3 wallets)
6. Should each wallet have its own signing mode (internal/external), or is signing mode user-level?

### Performance
7. With Tier 1 (fetch on every message), is 300-500ms acceptable latency? Or will users notice?
8. Should we use Helius's `getAssetsByOwner` DAS API instead of raw RPC calls for richer token data (names, images, USD values)?
9. At what user count should we move from Tier 1 to Tier 3?

### Webhooks
10. Should we register one webhook with all user wallet addresses (simpler, but Helius has limits), or one webhook per user (more webhooks, but isolated)?
11. How do we handle webhook failures? If Helius can't reach our receiver, snapshots go stale. Should we have a fallback poll?
12. What Helius transaction types should we subscribe to? `SWAP`, `TRANSFER`, `ANY`? What about NFTs, staking, DeFi interactions?

### Data
13. What token data should the snapshot include? Just balances, or also USD values, 24h change, P&L since buy?
14. Should we store full transaction details in the snapshot, or just the last N signatures and re-fetch details on demand?
15. How long should we retain snapshot history? Just latest, or time-series for portfolio tracking?

### Agent Behavior
16. Should the agent always mention the wallet context, or only when relevant? (e.g., "gm" doesn't need a portfolio update)
17. How should the agent handle stale data? If the snapshot is 5 minutes old, should it say "data might be slightly stale" or just present it?
18. Should the agent proactively alert on significant changes? ("hey, your BONK just pumped 20% in the last hour")

### Security
19. Is caching wallet balances in our database a privacy concern? We're storing financial data.
20. Should webhook data be encrypted at rest?
21. Multi-wallet means users share wallet addresses — how do we prevent one user from seeing another's data if they add the same address?

### Alternatives
22. Is there a better approach than context injection? For example, could the agent query a "wallet memory" tool instead of having context injected?
23. Should we use Helius's enhanced transaction API (parsed, human-readable) instead of raw RPC for recent transactions?
24. Are there any existing patterns from other Telegram trading bots (BONKbot, Trojan, Photon) for how they handle wallet awareness?

---

## 11. Current Codebase References

| File | Purpose |
|---|---|
| `backend/tg-bot/src/bot.py:1511-1521` | Where session_state is built (inject context here) |
| `backend/agent_prompt.py` | System prompt with `{wallet_context}` placeholder |
| `backend/mcp-servers/read-mcp/server.py:159-258` | Existing wallet balance/token/tx MCP tools |
| `backend/mcp-servers/token-data/server.py` | Birdeye PnL tool with USD values |
| `backend/services/webhook_receiver/server.py:326-408` | Existing Helius webhook handler |
| `backend/db/models.py` | UserProfile (single wallet), WalletAlert (watching) |
| `backend/db/database.py` | SQLAlchemy SessionLocal + engine |
| `backend/main.py` | AgentOS FastAPI app |

### Key Environment Variables
| Variable | Purpose |
|---|---|
| `HELIUS_API_KEY` | Helius RPC + API |
| `SOLANA_RPC_URL` | Helius RPC endpoint |
| `HELIUS_WEBHOOK_AUTH_HEADER` | Webhook auth secret |
| `WEBHOOK_RECEIVER_PORT` | Webhook receiver port (8010) |

---

*Document generated 2026-04-22. For review by external agents to validate architecture before implementation.*
