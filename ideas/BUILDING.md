# Kade — Your Sharp Friend on the Solana Blockchain

## Status: BUILDING 🚀

## Name & Identity
- **Name**: Kade
- **Domain**: kade.sol
- **Telegram**: @kade_sol_bot
- **Personality**: Sharp, crypto-native friend who lives on-chain. Knows everything, drops alpha casually, doesn't waste words. Slightly ahead of you on everything. Speaks like a real person in your DMs, not a bot.
- **Tagline**: "Your sharp friend on the Solana blockchain"

## One-liner
An AI agent that talks to the Solana blockchain — query on-chain data, track wallets, check prices, detect threats, and resolve .sol domains, all through natural language.

## Existing Codebase: `/Users/uzaxirr/work/solagent`

The project already has a solid foundation deployed on Railway.

### What's Already Built ✅

| Capability | Implementation | Details |
|---|---|---|
| **Telegram Bot** | `tg-bot/` | Full bot with streaming responses, /start, /wallet, /clear, /help |
| **Agno Agent + AgentOS** | `main.py` (port 7777) | xAI Grok-4 powered, FastAPI, session state, memory injection |
| **SNS Resolution** | `mcp-servers/sns-resolver/` (port 8002) | `resolve_sns_domain`, `reverse_lookup` |
| **Wallet Queries** | `mcp-servers/read-mcp/` (port 8001) | `get_balance`, `get_token_accounts`, `get_recent_transactions`, `get_transaction_details` |
| **Token Price/Data** | `mcp-servers/token-data/` (port 8003) | Birdeye: `get_token_overview`, `get_trending_tokens`, `get_token_holders`, `get_token_creation_info`, `search_tokens` |
| **Transaction Execution** | `mcp-servers/transaction-executor/` (port 8004) | SOL/token transfers, Jupiter swaps |
| **Price Alerts** | `mcp-servers/price-alerts/` (port 8005) | Price alert management |
| **Wallet Alerts** | `services/webhook_receiver/` (port 8010) | Helius webhooks → Telegram notifications, full DB schema (`wallet_alerts`, `helius_webhook_config`) |
| **Prediction Markets** | `mcp-servers/prediction-markets/` (port 8006) | Polymarket via Dome API |
| **Market Research** | `mcp-servers/market-research/` (port 8007) | LunarCrush sentiment/news |
| **BYOMCP** | `hooks/mcp_hooks.py` | Users add custom MCP servers via chat — stored in DB, injected per-request |
| **Database** | `db/` | PostgreSQL + Alembic: user_profiles, wallet_alerts, user_preferences, user_mcp_servers, helius_webhook_config |
| **Wallet Creation** | `tg-bot/src/privy.py` | Privy embedded wallets for users |
| **Deployment** | Railway + Docker + supervisord | Live at solagent-app-production.up.railway.app |

### Tech Stack (Actual)
- **Language**: Python 3.12+
- **Agent Framework**: Agno 2.3.21
- **MCP**: FastMCP (SSE transport)
- **LLM**: xAI Grok-4
- **Database**: PostgreSQL + SQLAlchemy + Alembic
- **Bot**: python-telegram-bot
- **Data APIs**: Helius (RPC + webhooks), Birdeye (token data), LunarCrush (sentiment)
- **Wallet**: Privy embedded wallets
- **Deployment**: Railway (2 services: main app + webhook receiver)

---

## What Needs to Be Built 🔨

### P0 — Must ship for demo day (Week 1-2)

#### 1. Historical Price Data
**Status**: ❌ Not built
**Why**: Enables the killer cross-data queries ("what was BONK price when toly.sol first received it?")
**What to do**:
- Add `get_historical_price(token_address, timestamp)` tool to `mcp-servers/token-data/server.py`
- Birdeye API has `GET /defi/history_price` endpoint — needs token address + Unix timestamp
- Also add `get_price_at_date(token_address, date_string)` for human-friendly dates
**Effort**: Small — 1 new tool in existing MCP server

#### 2. Cross-data Query Support
**Status**: ❌ Not built (but all underlying data sources exist)
**Why**: This IS the demo — "when did toly.sol first receive BONK and what was the price then vs now?"
**What to do**:
- The Agno agent already routes to multiple MCP tools. The LLM needs to chain: SNS resolve → tx history scan → filter for token → get timestamp → historical price lookup → current price lookup
- Update `agent_prompt.py` to include examples of multi-step reasoning for cross-data queries
- Test with 10+ complex query patterns and tune the prompt
**Effort**: Medium — mostly prompt engineering + the historical price tool above

#### 3. Transaction Analysis Enhancement
**Status**: ⚠️ Partial — `get_transaction_details` exists but may not parse DeFi interactions deeply
**Why**: "What was the biggest transaction from this wallet last week?" requires filtering + ranking
**What to do**:
- Add `get_transactions_by_date_range(address, start_date, end_date)` to `read-mcp`
- Add `get_largest_transactions(address, count, days)` convenience tool
- Use Helius parsed transaction format to identify swaps, stakes, transfers with amounts
**Effort**: Medium — new tools in existing MCP server

---

### P1 — Ship for competitive edge (Week 2-3)

#### 4. Security Monitoring — Program Authority Changes (Drift-style)
**Status**: ❌ Not built
**Why**: The Drift hack ($270M, April 1 2026) was caused by an undetected authority change. This is the most topical feature possible.
**What to do**:
- **New MCP server**: `mcp-servers/security-monitor/` (port 8008)
- Tools:
  - `check_program_authority(program_address)` — returns current authority, checks against known good state
  - `get_program_authority_history(program_address)` — historical authority changes via Helius
  - `check_durable_nonces(address)` — scan for durable nonce accounts associated with an address
  - `scan_wallet_program_exposure(wallet_address)` — list all programs the wallet has interacted with + their current authority status
- For alerts: extend `services/webhook_receiver/` to monitor authority accounts via Helius webhooks
- New DB table: `program_authority_watches` (program_address, known_authority, user_id, is_active)
**Effort**: Large — new MCP server + webhook extension + DB migration

#### 5. NL-Configured Alerts
**Status**: ⚠️ Partial — wallet alerts exist but only for "watch this wallet address"
**Why**: Users should say "alert me when any wallet buys >$50K of BONK" and it just works
**What to do**:
- Extend `mcp-servers/price-alerts/` with:
  - `create_whale_alert(token, min_amount_usd)` — monitor DEX swaps above threshold
  - `create_authority_alert(program_or_wallet)` — Drift-style authority change alert
  - `create_custom_alert(natural_language_description)` — LLM parses into alert config
- The Agno agent prompt should understand alert intents and route to the right tool
- Store alert configs in DB, background worker checks conditions
**Effort**: Large — extends existing MCP + new background workers

#### 6. DeFi Position Reading
**Status**: ❌ Not built
**Why**: "What are my DeFi positions?" is a fundamental query for any Solana user
**What to do**:
- **New MCP server**: `mcp-servers/defi-reader/` (port 8009)
- Tools:
  - `get_defi_positions(wallet_address)` — aggregate view across protocols
  - `get_staking_positions(wallet_address)` — Marinade, Jito, Sanctum LST holdings
  - `get_lending_positions(wallet_address)` — Kamino, MarginFi, Solend positions
  - `get_lp_positions(wallet_address)` — Orca, Raydium, Meteora LP tokens
- Use Helius DAS API for token accounts + decode known DeFi program accounts
- Alternatively use Birdeye portfolio API or DeFiLlama SDK
**Effort**: Large — new MCP server, complex protocol-specific account parsing

---

### P2 — Nice to have (Week 4-5)

#### 7. Portfolio Risk Score
**Status**: ❌ Not built
**What to do**:
- Combine DeFi positions + authority monitoring + TVL data + protocol health
- Simple scoring: check authority age, TVL trend, audit status, concentration risk
- Return a 1-100 risk score per position and overall portfolio
**Effort**: Medium — depends on DeFi reader + security monitor being done

#### 8. Historical Analysis Queries
**Status**: ❌ Not built
**What to do**:
- "Show me all wallets that bought BONK before $0.01 and still hold"
- Requires indexing token transfer history — heavy query, may need Helius DAS or Birdeye holder snapshots
- Consider caching popular queries
**Effort**: Large — data intensive, may hit API limits

#### 9. Payment Integration (Monetization)
**Status**: ❌ Not built
**What to do**:
- Track query count per user in DB (add `query_count` / `daily_queries` to user_profiles or new table)
- Free tier: 10 queries/day, 3 alerts
- Pro tier: Stripe checkout or x402 micropayments
- Gate premium features (historical data, unlimited alerts, security monitoring)
**Effort**: Medium — Stripe integration is straightforward, x402 would be cooler for hackathon

#### 10. Metrics Dashboard (for demo day)
**Status**: ❌ Not built
**What to do**:
- Simple page showing: total users, queries served, active alerts, alerts fired
- Can be a basic HTML page or a Telegram admin command
- Needed for demo day to flash real numbers
**Effort**: Small

---

## Revised Architecture (Actual)

```
Telegram Bot (tg-bot/)
    │
    ▼
AgentOS API (main.py:7777) ──── Agno + xAI Grok-4
    │
    ├── MCP: read-mcp (8001)           ✅ Solana RPC via Helius
    ├── MCP: sns-resolver (8002)       ✅ .sol domain resolution
    ├── MCP: token-data (8003)         ✅ Birdeye prices/tokens
    │   └── TODO: historical price tool
    ├── MCP: transaction-executor (8004) ✅ Transfers, swaps
    ├── MCP: price-alerts (8005)       ✅ Price alerts
    │   └── TODO: whale alerts, NL alert config
    ├── MCP: prediction-markets (8006) ✅ Polymarket
    ├── MCP: market-research (8007)    ✅ LunarCrush sentiment
    ├── MCP: security-monitor (8008)   🔨 TODO — authority + nonce monitoring
    ├── MCP: defi-reader (8009)        🔨 TODO — protocol position reading
    ├── User's BYOMCP servers          ✅ Dynamic per-request injection
    │
    ▼
PostgreSQL (Railway)
    │
    ▼
Webhook Receiver (8010) ←── Helius Webhooks ←── Solana Blockchain
    └── TODO: authority change webhooks, whale movement webhooks
```

---

## Revised 5-Week Timeline

### Week 1 (April 7-13): Cross-data Queries ← YOU ARE HERE
- [x] Project scaffold — already done
- [x] SNS resolution — already done
- [x] Wallet queries — already done
- [x] Price check (current) — already done
- [x] Telegram bot — already done
- [x] Deployment on Railway — already done
- [ ] Add `get_historical_price` to token-data MCP
- [ ] Add `get_transactions_by_date_range` + `get_largest_transactions` to read-mcp
- [ ] Tune agent prompt for multi-step cross-data reasoning
- [ ] Test 10+ complex queries, fix failure modes
- [ ] Deploy updated version, get 5 Network State residents testing

### Week 2 (April 14-20): Security + DeFi
- [ ] Build `security-monitor` MCP server (authority checks, nonce scanning)
- [ ] Build `defi-reader` MCP server (staking, lending, LP positions)
- [ ] Extend webhook receiver for authority change alerts
- [ ] DB migration for `program_authority_watches` table
- [ ] Expand to 20-30 users via Superteam

### Week 3 (April 21-27): Smart Alerts + Monetization
- [ ] NL alert configuration ("alert me when...")
- [ ] Whale movement alerts (large DEX swaps)
- [ ] Durable nonce creation alerts
- [ ] Payment integration (Stripe or x402)
- [ ] Query counting + tier gating
- [ ] Push to 50+ users

### Week 4 (April 28 - May 4): Scale & Harden
- [ ] Portfolio risk scoring
- [ ] Caching layer for frequent queries
- [ ] Rate limiting + error handling hardening
- [ ] Performance optimization (parallel MCP calls where possible)
- [ ] Push to 100+ users, start collecting revenue

### Week 5 (May 5-13): Demo Polish
- [ ] Metrics dashboard (users, queries, alerts, revenue)
- [ ] Demo script rehearsal with live data
- [ ] Landing page
- [ ] Bug fixes from real usage
- [ ] Record backup demo video

---

## Hackathon Tracks
- **Primary**: AI agents with onchain identity
- **Side track**: SNS (.sol domain resolution is core to the product)
- **Secondary tags**: DeFi, infrastructure

## Revenue Model
- Free: 10 queries/day, 3 alerts
- Pro $9.99/mo: unlimited queries, unlimited alerts, historical data
- Whale $49/mo: API access, webhooks, portfolio monitoring, security alerts

## Demo Day Script (May 14)
1. Live Telegram demo — 3 progressively complex questions:
   - "What's the price of BONK?" (simple — shows it works)
   - "When did toly.sol first receive BONK and what was the price then vs now?" (cross-data — the wow moment)
   - "Alert me if any program in my wallet changes authority" (security — the Drift story)
2. Show alert firing in real-time (pre-staged devnet authority change)
3. Flash real metrics: X users, Y queries served, Z active alerts, $W MRR
4. Pitch: "After Drift, Solana needs eyes everywhere. We built them."

## Key Risks
1. **Helius/Birdeye API rate limits** — cache aggressively, batch where possible
2. **Cross-data query reliability** — LLM may fail at multi-step reasoning. Mitigate with explicit chain-of-thought in prompt + fallback to simpler queries
3. **Historical data depth** — old wallets may have truncated tx history via Helius. Plan fallback to Solscan API
4. **Alert latency** — Helius webhooks are near-real-time but not instant. For authority monitoring, consider polling critical accounts every 30s
5. **MCP 10s timeout** — all MCP tools must return within 10s. Historical queries may be slow — add timeout handling

## Competitive Advantage
1. **Already deployed + working** — most hackathon teams start from zero
2. **BYOMCP** — no competitor lets users plug in custom data sources
3. **Multi-tool agent** — not just one trick; SNS + prices + txs + alerts + DeFi + security in one bot
4. **Post-Drift security angle** — incredibly topical, judges will know the story
5. **Telegram-native** — meets users where they already trade (74% of Solana volume)
