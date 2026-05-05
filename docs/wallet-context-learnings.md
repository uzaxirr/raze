# Wallet Context Architecture — Learnings from Perplexity Review

## Key Validations

1. **Three-tier approach is correct** and matches industry patterns (BONKbot, Trojan, open-source trackers all use webhook + datastore, not per-message RPC)
2. **Separate `user_wallets` table** is the right design (not JSONB on user_profiles)
3. **Webhook + snapshot is how all serious bots work** — BONKbot, Trojan, Photon all read from cached internal state, not chain
4. **Per-wallet signing mode** is more flexible than user-level (internal/external/watch_only)

## Critical Refinements

### 1. Split context from execution data
- **Prompt context:** Compact wallet summary (150-250 tokens) injected every message for conversational awareness
- **Execution data:** Dedicated MCP tool `get_cached_wallet_snapshot(force_refresh=True)` for when agent needs exact numbers to build trades
- **Why:** Never execute trades based on stale prompt context. The agent should call the tool to get fresh verified data before building any transaction.

### 2. Converge on Tier 2+3 quickly, Tier 1 as fallback
- Don't linger on Tier 1 (per-message fetch). Ship Tier 2 (cached snapshots) as the primary read path immediately.
- Tier 1 becomes a **fallback** triggered when snapshot is stale or webhook seems down.
- Webhook (Tier 3) should be the primary write path as soon as possible.

### 3. Use DAS `getAssetsByOwner` + Birdeye PnL
- **Helius DAS:** Single call returns all tokens + metadata (names, symbols, decimals). Replaces 2-3 raw RPC calls.
- **Birdeye PnL API:** Single call returns per-token PnL with USD values. Already have this as an MCP tool.
- **Combination:** DAS for holdings, Birdeye for valuation/PnL = rich snapshot in 2 API calls instead of 5+.

### 4. One webhook, dynamic address list
- Single Helius webhook with all user wallet addresses (not one per user)
- Dynamically update address list via Helius API when users add/remove wallets
- Helius free plan: 2 webhooks, 100K events/month. Growth plan for production.

### 5. Staleness checks as webhook safety net
- Track `updated_at` and `update_source` in snapshots
- On each message: if snapshot older than 60-120s, trigger direct RPC refresh
- Background poller reconciles active wallets periodically to catch missed webhook events

## Industry Pattern (How Bots Actually Work)

```
On-chain events → Helius webhook → Update wallet_snapshots DB
                                          ↓
User sends message → Read snapshot (0ms) → Inject into agent context
                                          ↓
Agent responds with portfolio awareness (no RPC in hot path)
```

BONKbot, Trojan, and open-source trackers ALL follow this pattern. Per-message RPC is only used in simple hobby bots.

## Multi-Wallet Handling

### Ambiguity resolution
- One wallet is `is_default` — commands like "swap my SOL" target this wallet
- Users label wallets ("phantom", "backpack", "cold")
- Agent resolves by label: "my phantom wallet" → correct address
- If ambiguous: ask ONE clarifying question, don't guess

### Signing mode per wallet
- `internal` — Privy-controlled, backend signs
- `external` — User signs via sign page
- `watch_only` — Monitor only, no execution

### Ownership verification
- For execution wallets: require signature challenge (sign a message to prove ownership)
- For watch-only: no verification needed (addresses are public)
- Multiple users CAN add the same address (it's public data)

## Context Injection Best Practices

### Format
```xml
<portfolio_context updated="3s ago">
Portfolio: $145.47 across 2 wallets

phantom (D4M5...YqpJ) — default:
  SOL: 0.034 ($2.97) | USDC: 3.73 ($3.73)
  Total: $19.10

backpack (Cu5r...jMHN):
  SOL: 1.5 ($126.37)
  Total: $126.37

Recent:
  • 2min ago: swap 1 USDC → SOL ✅
  • 1hr ago: received 2 SOL
</portfolio_context>
```

### Rules
- Keep under 250 tokens
- Truncate to top 5 tokens by USD value
- Last 3 transactions max
- Include `updated` timestamp so agent knows freshness
- Tell agent in system prompt: "treat as ground truth but don't restate unless relevant"
- For trades: agent MUST call `get_cached_wallet_snapshot(force_refresh=True)` before executing

## Race Condition Protection

Risk: User signs swap → agent builds another trade on stale snapshot

Mitigations:
- Include `snapshot_as_of` timestamp in context
- For large trades ("swap ALL my SOL"): force-refresh before executing
- After any signed transaction: invalidate snapshot, force refresh on next message

## PnL Optimization

- Don't call Birdeye PnL API every message (rate limited, expensive)
- Compute PnL snapshot every few minutes or on webhook events
- Store in `wallet_snapshots` for quick reference
- Lightweight price feeds for "portfolio value" updates between PnL refreshes

## What to Build (Priority Order)

1. **Tier 2: `wallet_snapshots` table + read from cache on every message** — ship first
2. **DAS `getAssetsByOwner` for snapshot refresh** — replaces raw RPC
3. **Tier 3: Helius webhook updates snapshots** — primary write path
4. **Multi-wallet `user_wallets` table** — enables multiple wallets
5. **Split context/execution** — prompt injection + MCP tool for fresh data
6. **Staleness fallback** — background poller catches webhook gaps
7. **PnL caching** — periodic Birdeye refresh, not per-message
