# Raze V2 External Signing Architecture — Implementation Plan

## For Reviewing Agents

This document describes the **target architecture** for Raze's external transaction signing flow. It replaces the current implementation which has critical security issues, architectural inconsistencies, and reliability problems (documented in `docs/signing-flow-learnings.md`).

**Your job:** Review this plan for correctness, security, and completeness. Identify anything we're missing or doing wrong. Flag trade-offs we should consider.

---

## 1. What Changed and Why

### Current (v1) — What We're Replacing
- Bot builds unsigned transaction server-side, stores it in session
- Session stores the full base64 transaction (goes stale — blockhash expires in ~90s)
- Two incompatible Jupiter API versions (v2 /order for bot, v1 /swap for QR)
- In-memory session store (Map) — wiped on every deploy
- No auth on session GET or completion endpoints
- Jupiter API key exposed in client-side JavaScript
- Bot notification via direct Telegram API call (agent doesn't know tx completed)
- Fees only work on some paths

### Target (v2) — What We're Building
- Bot creates an **intent** (what the user wants to do), NOT a transaction
- Transaction is built **fresh at sign time** — current blockhash, correct wallet
- Unified Jupiter v2 API for all swap paths
- PostgreSQL session store (survives deploys)
- Auth on all endpoints (viewerToken)
- Jupiter API key stays server-side (proxy pattern)
- Server-side completion verification (on-chain check before marking done)
- Fees on ALL paths

---

## 2. Revenue Model — Fees on Every Path

### Swap Fees (Jupiter Referral Program)

| Path | Jupiter API | Fee mechanism | Fee rate | Referral account | Notes |
|---|---|---|---|---|---|
| WalletConnect (managed) | v2 `/order` + `/execute` | `referralAccount` + `referralFee` | 200 bps (2%) | Ultra: `5JZe6...` | Best: Jupiter handles landing, multi-router |
| QR / Solana Pay (wallet broadcast) | v1 `/quote` + `/swap` | `platformFeeBps` + `feeAccount` | 200 bps (2%) | Swap+Trigger: `2sZdp...` | v1 supports `asLegacyTransaction` + `trackingAccount` |
| Internal (Privy) | v2 `/order` + Privy sign+send | `referralAccount` + `referralFee` | 200 bps (2%) | Ultra: `5JZe6...` | Privy broadcasts directly |

**Why two referral accounts:** Jupiter has separate referral programs for Ultra (v2) and Swap+Trigger (v1). Each has its own referral account and token accounts. We have both set up at referral.jup.ag.

**Why v1 for QR path:** v2 does NOT support `asLegacyTransaction` or `trackingAccount`. Phantom's Solana Pay rejects versioned transactions. v1 is deprecated but still functional. This is a pragmatic trade-off — we get legacy tx + reference key + fees, at the cost of Metis-only routing (no RFQ).

**Important: `referralFee` disables JupiterZ/RFQ routing** on v2 /order. Since we always include referral params, we're on Metis/Iris routing regardless. This means the pricing advantage of Ultra is partially negated when we collect fees. Trade-off: fees vs best price.

**Fee collection works regardless of who broadcasts.** Fees are baked into the swap instructions. Whether Jupiter /execute broadcasts or Phantom broadcasts via its own RPC, the fee transfer instructions execute on-chain.

**Key insight:** Referral fees are baked INTO the transaction instructions by Jupiter. Whether Jupiter `/execute` broadcasts it or the wallet broadcasts it directly, the fees are still collected. The referral parameters affect transaction construction, not broadcast.

**Jupiter fee split:** Jupiter takes 20% of the integrator fee, Raze keeps 80%. At 200 bps (2%), Raze earns 1.6% effective on every swap.

**Jupiter v2 /order referralFee range:** 50-255 bps. Our 200 bps is valid.

### Transfer Fees (Our Own)

| Transaction type | Fee rate | Fee destination | Mechanism |
|---|---|---|---|
| SOL send | 100 bps (1%) | `D4M5cGfxFW9jZ4uLL24HPYMYur2cRGPdDZDGFVitYqpJ` | Extra `SystemProgram.transfer` instruction to fee account |
| SPL token send | 100 bps (1%) | ATA of fee account for that mint | Extra `TokenProgram.transfer` instruction to fee ATA |

Transfer fees are deducted from the send amount (user sends `amount - fee`, fee goes to Raze). These are custom instructions we add to the transaction, not Jupiter's referral program.

### Trade-off: QR Path Fee Reliability

When the wallet broadcasts directly (QR path), we lose Jupiter's landing engine. The transaction might drop. If it drops, no fees collected. With `/execute`, Jupiter retries and handles landing — higher success rate = more fee revenue.

**Decision:** Keep both paths. WalletConnect + `/execute` is primary (better landing = more revenue). QR is fallback for mobile users who can't use WalletConnect reliably.

---

## 3. Architecture Overview

```
User: "swap 1 USDC to SOL"
         │
    ┌────▼─────────────────────────────────────────┐
    │ Telegram Bot (Python)                         │
    │                                               │
    │ 1. Agent calls swap_tokens() MCP tool         │
    │    → signing_mode: "external"                 │
    │    → returns {status: "pending_signature",    │
    │       type: "swap", from_token, to_token,     │
    │       amount, network}                        │
    │    → NOTE: NO unsigned_transaction returned    │
    │                                               │
    │ 2. Bot calls POST /api/sign/sessions          │
    │    with intent params + telegramChatId         │
    │    → gets {sessionId, viewerToken}             │
    │                                               │
    │ 3. Bot sends inline button:                   │
    │    "Sign Transaction"                         │
    │    → raze.fun/sign/{sessionId}?t={viewerToken}│
    └────┬─────────────────────────────────────────┘
         │
    ┌────▼─────────────────────────────────────────┐
    │ Sign Page (raze.fun/sign/{id}?t=xxx)          │
    │                                               │
    │ 1. Fetches session intent (auth via token)    │
    │    GET /api/sign/sessions/{id}?t=xxx          │
    │    → {type, fromToken, toToken, amount,       │
    │       network, status, expiresAt}             │
    │                                               │
    │ 2. Shows transaction preview                  │
    │    (amounts, tokens, network, countdown)      │
    │                                               │
    │ 3. Two tabs:                                  │
    │                                               │
    │    [Connect Wallet] ──────────────────────┐   │
    │    │ User connects via Reown AppKit        │   │
    │    │ Page calls POST /api/sign/{id}/build  │   │
    │    │   → Server: Jupiter v2 /order (fresh) │   │
    │    │   → Returns: {unsignedTx, requestId}  │   │
    │    │ Wallet signs tx                       │   │
    │    │ Page calls POST /api/sign/{id}/submit │   │
    │    │   → Server: Jupiter v2 /execute       │   │
    │    │   → Server: verify on-chain           │   │
    │    │   → Server: update session            │   │
    │    │   → Server: notify bot                │   │
    │    │ Page shows success                    │   │
    │    └──────────────────────────────────────┘   │
    │                                               │
    │    [Scan QR] ────────────────────────────┐    │
    │    │ QR encodes Solana Pay URL            │    │
    │    │ Phantom scans                        │    │
    │    │ Phantom POST /api/sign/{id}/pay      │    │
    │    │   → Server: Jupiter v2 /order (fresh)│    │
    │    │   → Returns legacy tx with fees      │    │
    │    │ Phantom signs + broadcasts via RPC   │    │
    │    │ Server polls findReference()          │    │
    │    │   → Detects tx on-chain              │    │
    │    │   → Verifies signer + reference      │    │
    │    │   → Updates session                  │    │
    │    │   → Notifies bot                     │    │
    │    │ Page shows success (via status poll)  │    │
    │    └─────────────────────────────────────┘    │
    └──────────────────────────────────────────────┘
```

---

## 4. Database Schema

```sql
-- Replace in-memory Map with PostgreSQL
CREATE TABLE sign_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_token_hash TEXT NOT NULL,   -- SHA-256 of viewer token (never store plaintext)

  -- Intent (what the user wants to do — NO pre-built transaction)
  type TEXT NOT NULL CHECK (type IN ('swap', 'sol_transfer', 'token_transfer')),
  wallet_address TEXT,               -- Expected signer (from bot session_state)
  from_token TEXT,                   -- Symbol or mint address
  to_token TEXT,                     -- Symbol or mint (swaps) or NULL (sends)
  amount NUMERIC NOT NULL,           -- Human-readable amount (e.g., 1.5)
  to_address TEXT,                   -- Recipient (sends only)
  slippage_bps INT DEFAULT 50,       -- Swap slippage tolerance
  network TEXT DEFAULT 'mainnet',

  -- Tracking
  reference_key TEXT NOT NULL,       -- Random pubkey for on-chain detection via findReference()
  telegram_chat_id BIGINT,           -- For bot notification
  execution_mode TEXT,               -- 'managed_execute' | 'wallet_broadcast' (set when user picks method)

  -- Status machine
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'building', 'signing', 'submitted', 'confirmed', 'finalized', 'expired', 'failed')),
  tx_hash TEXT,                      -- Solana transaction signature (set after confirmation)
  error_message TEXT,

  -- Display metadata (updated after /build or /pay builds the tx)
  from_symbol TEXT,
  to_symbol TEXT,
  output_amount NUMERIC,
  price_impact TEXT,
  fee_amount NUMERIC,
  fee_bps INT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  confirmed_at TIMESTAMPTZ,
  finalized_at TIMESTAMPTZ
);

-- Audit trail for debugging and incident review
CREATE TABLE sign_session_events (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID REFERENCES sign_sessions(id),
  event TEXT NOT NULL,               -- created, page_opened, wallet_connected, tx_built, signed, submitted, reference_detected, confirmed, finalized, expired, failed, bot_notified
  data JSONB,                        -- Event-specific data (requestId, signature, error, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sign_sessions_status ON sign_sessions(status) WHERE status NOT IN ('confirmed', 'finalized', 'expired', 'failed');
CREATE INDEX idx_sign_sessions_reference ON sign_sessions(reference_key);
CREATE INDEX idx_sign_sessions_expires ON sign_sessions(expires_at) WHERE status = 'pending';
```

**Why PostgreSQL, not Redis:**
- We already have PostgreSQL on Railway
- Sessions need durability (survive deploys)
- Event log for debugging needs persistence
- TTL can be handled by a cleanup query or pg_cron
- Redis adds another service ($5/mo) for no benefit at our scale

---

## 5. API Endpoints

### 5.1 POST /api/sign/sessions — Create Intent Session

**Called by:** Bot (Python)
**Auth:** `x-sign-secret` header (MUST fail if env var missing — no fallback)

```typescript
// Request
{
  type: "swap" | "sol_transfer" | "token_transfer",
  walletAddress: "Cu5rd3...",       // Expected signer
  fromToken: "USDC",                // Symbol or mint
  toToken: "SOL",                   // For swaps
  amount: 1.0,                      // Human-readable
  toAddress: "7xK...",              // For sends
  slippageBps: 50,                  // For swaps
  network: "mainnet",
  telegramChatId: 123456789
}

// Response
{
  sessionId: "a1b2c3d4-...",
  viewerToken: "vt_raze_abc123...", // Random, high-entropy, sent to user in URL
  expiresAt: 1776760000000
}
```

**Server logic:**
1. Validate `x-sign-secret`
2. Generate UUID session ID
3. Generate random `viewerToken` (32 bytes, base64url)
4. Generate random `referenceKey` (Keypair, store public key)
5. Hash `viewerToken` with SHA-256, store hash (never store plaintext)
6. Insert into PostgreSQL
7. Log event: `created`

**Why viewer token:** The session ID is in the URL (visible in Telegram messages, browser history, logs). The viewer token is a separate secret that authenticates read access. Without it, knowing the session ID alone isn't enough to read session data.

### 5.2 GET /api/sign/sessions/{id} — Fetch Session Intent

**Called by:** Sign page (browser)
**Auth:** `?t={viewerToken}` query param — hash and compare against stored hash

```typescript
// Response (REDACTED — no unsigned_transaction, no viewerToken)
{
  type: "swap",
  fromToken: "USDC",
  toToken: "SOL",
  amount: 1.0,
  network: "mainnet",
  status: "pending",
  expiresAt: 1776760000000,
  referenceKey: "Abc123...",  // Public key for QR polling
  walletAddress: "Cu5rd3...", // For wallet mismatch check
  // Display fields (populated after /build):
  fromSymbol: "USDC",
  toSymbol: "SOL",
  outputAmount: 0.0116,
  priceImpact: "0.0199",
  feeAmount: 0.02,
  feeBps: 200
}
```

**Why no transaction in response:** The transaction is built at sign time, not stored. This prevents stale blockhash issues and ensures the response can't be used to replay or front-run transactions.

### 5.3 POST /api/sign/sessions/{id}/build — Build Fresh Transaction

**Called by:** Sign page (WalletConnect path)
**Auth:** `?t={viewerToken}` query param

```typescript
// Request
{
  walletAddress: "Cu5rd3..."  // Connected wallet address
}

// Response
{
  unsignedTransaction: "AQAAA...", // Fresh base64 tx with current blockhash
  requestId: "jup-req-123",       // For Jupiter /execute
  outputAmount: 0.0116,
  priceImpact: "0.0199",
  feeBps: 200,
  feeAmount: 0.02
}
```

**Server logic:**
1. Validate viewer token
2. Check session not expired
3. Verify `walletAddress` matches `session.wallet_address` (if set)
4. For **swaps**: Call Jupiter v2 `/order` with:
   - `taker: walletAddress`
   - `referralAccount: "5JZe6rRbXoDjxcie4JLemUdXYsJk2k5L1TA1yekNGqKw"`
   - `referralFee: 200`
   - API key in `x-api-key` header (server-side only)
5. For **SOL sends**: Build `SystemProgram.transfer` with fee instruction + fresh blockhash
6. For **token sends**: Build `TokenProgram.transfer` with fee instruction + ATA creation if needed
7. Update session: `status = "building"`, store `outputAmount`, `priceImpact`, `feeAmount`
8. Log event: `tx_built` with requestId
9. Return unsigned transaction + requestId

**Why build on the server, not the client:**
- Jupiter API key stays server-side
- Server can add referenceKey to send transactions
- Server controls fee parameters
- Server validates wallet address
- Single source of truth for what transaction was built

### 5.4 POST /api/sign/sessions/{id}/submit — Submit Signed Transaction

**Called by:** Sign page (WalletConnect path)
**Auth:** `?t={viewerToken}` query param

```typescript
// Request
{
  signedTransaction: "AQAAA...",  // Base64 signed tx
  requestId: "jup-req-123"       // From /build response
}

// Response
{
  signature: "5abc...",
  status: "confirmed"
}
```

**Server logic:**
1. Validate viewer token
2. Check session not expired, status is "building" or "signing"
3. For **swaps with requestId**: Call Jupiter v2 `/execute` with signed tx + requestId
   - Jupiter handles landing, priority fees, confirmation
   - Returns signature
4. For **sends** (no requestId): Broadcast via `sendRawTransaction` to Solana RPC
5. **Verify on-chain:**
   - Call `getSignatureStatuses(signature)` — confirm it exists
   - Optionally: fetch full transaction, verify signer matches expected wallet
6. Update session: `status = "confirmed"`, `tx_hash = signature`, `confirmed_at = now()`
7. Log event: `confirmed` with signature
8. **Notify bot** (see section 7)
9. Return signature + status

**Why server-side /execute:**
- API key never leaves the server
- Jupiter's landing engine (Beam) has 50-400ms landing with optimized priority fees
- Server verifies on-chain before marking complete — never trusts the browser
- If /execute fails, server can return a specific error for retry

### 5.5 GET /api/sign/sessions/{id}/pay — Solana Pay Metadata

**Called by:** Wallet (Phantom) after scanning QR
**Auth:** None (Solana Pay spec requires unauthenticated GET)

```typescript
// Response
{
  label: "Swap 1 USDC → SOL",
  icon: "https://raze.fun/assets/imp-expressions/waving.png"
}
```

### 5.6 POST /api/sign/sessions/{id}/pay — Solana Pay Build Fresh Transaction

**Called by:** Wallet (Phantom) after scanning QR
**Auth:** None (Solana Pay spec — wallet sends `{account}`)

```typescript
// Request (from wallet)
{ account: "Cu5rd3..." }

// Response
{
  transaction: "AQAAA...",  // Fresh LEGACY base64 tx
  message: "Raze: Swap 1 USDC → SOL"
}
```

**Server logic:**
1. Read session from PostgreSQL
2. Check not expired, not completed
3. For **swaps**: Call Jupiter v2 `/order` with:
   - `taker: account` (wallet that scanned)
   - `referralAccount + referralFee` (FEES INCLUDED)
   - Then deserialize the versioned transaction, decompile, recompile as legacy
   - OR: use a separate endpoint that returns legacy-compatible transactions
   - Include `trackingAccount: session.referenceKey` if supported
4. For **sends**: Build legacy transaction with fee instructions + referenceKey as non-signer account
5. Update session: `execution_mode = "wallet_broadcast"`, `status = "signing"`
6. Log event: `tx_built_solanapay`
7. Return transaction + message with CORS headers

**Trade-off: Legacy vs Versioned for QR**

| Approach | Pros | Cons |
|---|---|---|
| Force legacy (`asLegacyTransaction: true` on v1) | Phantom Solana Pay works reliably | v1 is deprecated, some routes unavailable, uses Swap+Trigger referral account |
| Build via v2 /order (versioned) | Latest routing, fees via Ultra referral, best prices | Phantom Solana Pay had issues with versioned txs |
| Decompile v2 versioned → legacy | Best of both worlds | Complex, fragile, requires fetching ALTs |
| Use v2 /build (Router path) | Full control, raw instructions, compose legacy ourselves | Metis-only routing (no RFQ), need to handle fee account derivation ourselves |

**Critical finding from API research:**
- `trackingAccount` is **NOT supported** in v2 `/order` or `/build`
- `asLegacyTransaction` **does not exist** in v2 — response is always versioned (v0)
- v2 `/order` response is always a pre-assembled VersionedTransaction
- v2 `/build` returns raw instructions (not a transaction) — we compose ourselves

This means for QR/Solana Pay:
- We CANNOT use `trackingAccount` for reference key embedding in v2
- We MUST manually add the referenceKey as a non-signer account to an instruction
- We MUST either decompile versioned → legacy, or compose from `/build` instructions into a legacy transaction
- Alternatively: keep v1 `/swap` with `asLegacyTransaction: true` for QR path only (v1 is deprecated but still works)

**Options for QR path:**

| Option | Fees | Reference key | Legacy tx | Complexity |
|---|---|---|---|---|
| v2 `/build` + compose legacy tx ourselves | `platformFeeBps` + `feeAccount` (any SPL account) | Add manually as non-signer | We control format | HIGH — assemble tx from raw instructions + ALTs |
| v2 `/order` + decompile versioned → legacy | `referralAccount` + `referralFee` (Ultra) | Add manually after decompile | Must decompile + recompile | HIGH — fragile, ALT handling |
| v1 `/swap` + `asLegacyTransaction: true` | `platformFeeBps` + `feeAccount` | `trackingAccount` param | Native | LOW — but v1 is deprecated |
| v2 `/order` as-is (versioned) | `referralAccount` + `referralFee` (Ultra) | Add manually | No — versioned only | MEDIUM — but Phantom may reject in Solana Pay |

**Recommendation:** Use v1 `/swap` for QR path (legacy + trackingAccount + fees all work). Use v2 `/order` + `/execute` for WalletConnect path (best landing, versioned is fine for WalletConnect). Accept the dual-API approach as intentional — each path uses the best tool for its constraints. Migrate QR to v2 `/build` when we have time to implement instruction composition.

### 5.7 GET /api/sign/sessions/{id}/status — Poll Confirmation

**Called by:** Sign page (polls every 2s)
**Auth:** `?t={viewerToken}` (optional — status is not sensitive)

```typescript
// Response
{ status: "pending" }
// or
{ status: "confirmed", signature: "5abc..." }
```

**Server logic:**
1. Read session from PostgreSQL
2. If already confirmed → return cached result immediately
3. If referenceKey exists and status is "signing" or "submitted":
   - Call `findReference(connection, referenceKey, { finality: "confirmed" })`
   - If found: verify the transaction (signer matches, reference present)
   - Update session: `status = "confirmed"`, `tx_hash = signature`
   - Notify bot
4. Return status

**Why server-side polling (not client-side findReference):**
- RPC calls from the server are more reliable (dedicated endpoint, no CORS)
- Server can verify the transaction contents, not just that a signature exists
- Works even if the browser tab is closed
- Single source of truth

---

## 6. Sign Page (Frontend)

### Component Structure

```
/sign/[id]/page.tsx         — Server component (metadata)
/sign/[id]/SignClient.tsx    — Client component (all UI + logic)
/sign/[id]/WalletProvider.tsx — Reown AppKit initialization
```

### SignClient Flow

```
1. Parse viewerToken from URL: ?t=xxx
2. Fetch session: GET /api/sign/sessions/{id}?t=xxx
3. Show intent preview (amounts, tokens, countdown)
4. Two tabs:

[Connect Wallet]
  → AppKit <appkit-button />
  → On connect: verify wallet matches session.walletAddress
  → Call POST /api/sign/{id}/build?t=xxx with connected wallet
  → Update preview with real output amount / price impact
  → Show "Sign & Send" button
  → On click: walletProvider.signTransaction(tx)
  → Call POST /api/sign/{id}/submit?t=xxx with signed tx
  → Show success with Solscan link

[Scan QR]
  → Show QR via @solana/pay createQR
  → Poll GET /api/sign/{id}/status?t=xxx every 2s
  → On confirmed → show success
  → Timeout after 120s → show "try again"
```

### What's Different from v1

- No `unsignedTransaction` in session data — page calls `/build` on demand
- No `NEXT_PUBLIC_JUPITER_API_KEY` — all Jupiter calls go through our server
- Viewer token required for all API calls
- Polling works for BOTH tabs (not just QR) — server-side status is the source of truth
- No `Buffer.from()` in client (was breaking on some mobile browsers)

---

## 7. Bot Notification

### Current (v1): Direct Telegram API call from frontend
- Frontend POSTs to Telegram Bot API with `sendMessage`
- Agent conversation doesn't know the swap completed
- If frontend fails, no notification

### Target (v2): Server-side event → Backend notification

**Option A: Direct Telegram API from Next.js server (simple)**
- Server verifies on-chain → updates session → calls Telegram Bot API
- Same as v1 but from server, not browser
- Agent still doesn't know

**Option B: Webhook to backend (better)**
- Server verifies → POSTs to bot backend: `POST /api/sign-complete`
- Backend updates agent session state
- Agent can respond contextually: "your swap landed. 1 USDC → 0.012 SOL"
- Requires new endpoint on backend service

**Option C: Database polling from backend (most reliable)**
- Server updates PostgreSQL session status
- Backend polls sign_sessions table for newly confirmed transactions
- Backend notifies user + updates agent state
- No webhook needed, survives frontend restarts

**Recommendation:** Start with Option A (simple, works now). Migrate to Option C later for reliability. Option B is fragile (webhook can fail).

---

## 8. MCP Tool Changes

The `swap_tokens` tool in `server.py` changes for external mode:

### Current (v1):
```python
if signing_mode == "external":
    return {
        "status": "pending_signature",
        "type": "swap",
        "unsigned_transaction": swap_transaction,  # FULL TX — goes stale
        "request_id": request_id,
        ...
    }
```

### Target (v2):
```python
if signing_mode == "external":
    return {
        "status": "pending_signature",
        "type": "swap",
        # NO unsigned_transaction — intent only
        "from_token": from_symbol,
        "to_token": to_symbol,
        "input_amount": amount,
        "estimated_output": output_amount,  # Preview only
        "network": network,
    }
```

The bot then creates an intent session (not a transaction session). The transaction is built later at sign time.

**For sends (SOL/token):** Same change — return intent params, not pre-built tx.

---

## 9. Security Improvements

| Current | Target | Why |
|---|---|---|
| `RAZE_SIGN_SECRET \|\| "raze-dev-secret"` | Fail at startup if not set | Predictable shared credential |
| No auth on GET session | viewerToken (SHA-256 hash comparison) | Prevents session data leakage |
| No auth on /complete | Removed — server derives completion from on-chain data | Browser should never be system of record |
| `NEXT_PUBLIC_JUPITER_API_KEY` in browser | Server-side proxy via `/build` and `/submit` | API key abuse prevention |
| CORS `*` on all endpoints | Whitelist `raze.fun` for session endpoints; `*` for Solana Pay only | Prevents cross-origin abuse |
| No rate limiting | Rate limit session creation + status polling | Prevents enumeration |

---

## 10. Migration Plan

### Phase 1: Database + Auth (do first, no UX change)
1. Add `sign_sessions` + `sign_session_events` tables via Alembic migration
2. Replace in-memory `Map` with PostgreSQL queries
3. Add viewerToken generation + validation
4. Remove hardcoded secret fallback
5. Deploy — everything works as before but persistent

### Phase 2: Intent-Based Sessions (core change)
1. MCP tools return intent params (no unsigned_transaction for external)
2. Bot creates intent session (no tx in payload)
3. Add `/build` endpoint (server builds fresh tx on demand)
4. Add `/submit` endpoint (server calls Jupiter /execute)
5. Update SignClient to call /build before signing
6. Remove `NEXT_PUBLIC_JUPITER_API_KEY` from frontend
7. Deploy — WalletConnect path uses new flow

### Phase 3: QR Path Unification
1. Update Solana Pay POST handler to use v2 /order with fees
2. Test versioned tx with Phantom Solana Pay
3. If issues: implement legacy decompilation or v1 fallback
4. Unified fee collection on both paths
5. Deploy — QR path uses same Jupiter API as WalletConnect

### Phase 4: Bot Integration
1. Server-side bot notification (Option A or C)
2. Update agent session state on completion
3. Agent responds contextually after swap confirmation
4. Deploy — full loop closed

---

## 11. Open Questions for Reviewers

### Architecture
1. Is the intent-based approach (store params, build tx at sign time) the right pattern? Any downsides we're missing?
2. Should the `/build` endpoint return the unsigned transaction to the browser, or should signing happen server-side too (e.g., via a MPC/threshold signature scheme)?
3. For the QR path, should we attempt v2 /order (versioned) or go straight to a legacy-compatible approach? What's the risk of Phantom rejecting versioned txs in Solana Pay?

### Fees
4. Is 200 bps (2%) the right fee for swaps? Jupiter's range is 50-255 bps. Are we competitive with other Telegram bots?
5. For the QR path, can we use the **Ultra** referral account (`5JZe6...`) with v2 /order even though the wallet broadcasts (not Jupiter /execute)? Or does Ultra require /execute for fees to be collected?
6. Should transfer fees (1% on sends) also use Jupiter's referral program, or is our custom fee instruction the right approach?

### Security
7. Is SHA-256 sufficient for viewerToken hashing, or should we use bcrypt/argon2?
8. Should the `/pay` Solana Pay endpoint have ANY auth, or is the Solana Pay spec incompatible with auth?
9. How do we prevent session enumeration? Rate limiting + UUID entropy enough?

### Reliability
10. What retry strategy should the `/submit` endpoint use if Jupiter `/execute` returns a transient error?
11. Should we implement Helius webhooks for transaction confirmation instead of polling `findReference`? At what scale does polling become problematic?
12. What happens if the server confirms a transaction but the bot notification fails? Should we use a transactional outbox pattern?

### UX
13. When the user opens the sign page and picks "Connect Wallet", should we auto-build the transaction immediately, or wait until they click "Sign"? Auto-build shows real output amounts sooner but may build a tx that expires if the user is slow.
14. Should we show the estimated output from the bot's preview quote, or wait for the real quote from `/build`? The preview may differ from the real quote.
15. For mobile users in Telegram's in-app browser: should we default to QR tab or Connect Wallet tab? QR requires a second device (scan from phone), Connect Wallet has redirect issues.

### Trade-offs
16. Jupiter managed execute (/execute) is more reliable but adds latency (our server → Jupiter → Solana). Direct wallet broadcast is faster but less reliable. Is the trade-off worth it for the WalletConnect path?
17. PostgreSQL adds a database dependency to the frontend service. Should the session API live on the backend service instead, co-located with the database?
18. The viewerToken pattern adds complexity to every API call. Is the security benefit worth the UX cost (longer URLs, token management)?

---

## 12. File Changes Summary

| File | Action | Description |
|---|---|---|
| `db/models.py` | Add | SignSession + SignSessionEvent models |
| `db/alembic/versions/xxx_sign_sessions.py` | Add | Migration |
| `frontend/src/app/api/sign/sessions/route.ts` | New | POST — create intent session |
| `frontend/src/app/api/sign/sessions/[id]/route.ts` | New | GET — fetch session (auth) |
| `frontend/src/app/api/sign/sessions/[id]/build/route.ts` | New | POST — build fresh tx |
| `frontend/src/app/api/sign/sessions/[id]/submit/route.ts` | New | POST — submit signed tx |
| `frontend/src/app/api/sign/sessions/[id]/status/route.ts` | New | GET — poll confirmation |
| `frontend/src/app/api/sign/[id]/pay/route.ts` | Rewrite | Solana Pay — use v2 API + fees |
| `frontend/src/app/sign/[id]/SignClient.tsx` | Rewrite | Intent-based, calls /build+/submit |
| `backend/tg-bot/src/bot.py` | Modify | Intent-only session creation |
| `backend/mcp-servers/transaction-executor/server.py` | Modify | External mode returns intent, not tx |
| `frontend/src/app/api/tma/sign/` | Delete | Old session endpoints |

---

## 13. Environment Variables (Final)

| Variable | Service | Required | Purpose |
|---|---|---|---|
| `RAZE_SIGN_SECRET` | Backend + Frontend | YES (fail if missing) | Session creation auth |
| `JUPITER_API_KEY` | Frontend (server only) | YES | Jupiter v2 /order + /execute |
| `JUPITER_API_URL` | Backend | No (default v2) | `https://api.jup.ag/swap/v2` |
| `RAZE_REFERRAL_ACCOUNT` | Frontend (server) + Backend | No (default Ultra) | `5JZe6rRbXoDjxcie4JLemUdXYsJk2k5L1TA1yekNGqKw` |
| `RAZE_REFERRAL_FEE_BPS` | Frontend (server) + Backend | No (default 200) | Swap fee in basis points |
| `RAZE_TRANSFER_FEE_BPS` | Backend | No (default 100) | Send fee in basis points |
| `RAZE_TRANSFER_FEE_ACCOUNT` | Backend + Frontend (server) | No (default) | SOL/token send fee recipient |
| `NEXT_PUBLIC_REOWN_PROJECT_ID` | Frontend (client) | YES | WalletConnect |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Frontend (both) | No | Solana RPC |
| `DATABASE_URL` | Frontend (server) | YES | PostgreSQL for sessions |
| `TELEGRAM_BOT_TOKEN` | Frontend (server) | YES | Bot notification |
| `HOSTNAME` | Frontend | No (default 0.0.0.0) | Railway standalone |

**Removed:** `NEXT_PUBLIC_JUPITER_API_KEY` — no longer needed, all Jupiter calls are server-side.

---

*Document generated 2026-04-21. Based on learnings from three independent reviews of the v1 implementation.*
