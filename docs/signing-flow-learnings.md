# Signing Flow Review — Consolidated Learnings

Generated from three independent reviews (Perplexity deep review, ChatGPT architectural review, Perplexity alternative architecture analysis) of the Raze external signing flow.

---

## Key Insight: We're Building Two Systems, Not One

All three reviewers identified the same core problem: **the QR path and the WalletConnect path are fundamentally different execution engines masquerading as tabs on the same page.** They share a session object but have incompatible assumptions:

| | QR (Solana Pay) | WalletConnect |
|---|---|---|
| Transaction source | Fresh from Jupiter v1 at scan time | Pre-built from session (stale) |
| Who broadcasts | Phantom via its own RPC | Our frontend via Jupiter /execute |
| Blockhash | Fresh (built on POST) | Stale (built when bot responded) |
| Confirmation detection | Reference key + findReference polling | Direct — we get the signature back |
| Jupiter API version | v1 /quote + /swap | v2 /order + /execute |
| Transaction format | Legacy (asLegacyTransaction: true) | Versioned |
| Referral fees | Not included (different API path) | Included via referralAccount |
| Landing reliability | Wallet-dependent (no Jupiter landing engine) | Jupiter managed landing |

**This is not a bug to fix — it's an architecture to redesign.**

---

## The Right Architecture: Intent-Based, Not Transaction-Based

All three reviewers converge on the same recommendation:

### Store an INTENT, not a transaction

The session should contain:
```
{
  wallet, fromToken, toToken, amount, slippage, network, telegramChatId
}
```

NOT a pre-built base64 transaction. The transaction is built **at sign time** — fresh blockhash, fresh quote, correct wallet.

### Two explicit execution modes

**Mode 1: Managed Execute (primary, best for swaps)**
- User connects wallet on sign page (WalletConnect or browser extension)
- Frontend calls our server: "build me a fresh swap for this wallet"
- Server calls Jupiter v2 `/order` → gets fresh tx + requestId
- Frontend signs with wallet
- Frontend sends signed tx to OUR SERVER (not Jupiter directly)
- Server calls Jupiter v2 `/execute` with API key server-side
- Server confirms, updates session, notifies bot
- **Jupiter handles landing, priority fees, confirmation**

**Mode 2: Wallet Broadcast (fallback, for mobile QR)**
- User scans QR with Phantom
- Phantom POSTs to our Solana Pay endpoint
- Server builds fresh legacy tx via Jupiter (with trackingAccount)
- Phantom signs and broadcasts via its own RPC
- Server polls findReference() to detect confirmation
- **Less reliable — no Jupiter landing engine**

### Server owns completion

The browser should NEVER be the system of record for "transaction completed." The server should:
1. Verify the signature exists on-chain
2. Verify the signer matches the expected wallet
3. Verify the transaction includes the referenceKey
4. THEN mark the session as completed
5. THEN notify the bot

Currently: the browser POSTs to `/complete` with a txHash and we blindly trust it.

---

## Priority Fixes (Consensus Across All Three Reviews)

### P0 — Do Immediately

1. **Remove hardcoded secret fallback**
   - Current: `process.env.RAZE_SIGN_SECRET || "raze-dev-secret"`
   - Fix: Throw error at startup if not set. Both bot.py and route.ts.
   - All three reviewers flagged this as critical.

2. **Server-side completion verification**
   - Current: `/complete` blindly trusts `{txHash}` from browser
   - Fix: Verify on-chain — signature exists, signer matches, referenceKey present
   - "Never trust browser POST /complete" — Perplexity

3. **Move Jupiter API key server-side**
   - Current: `NEXT_PUBLIC_JUPITER_API_KEY` exposed in browser bundle
   - Fix: Create `/api/jupiter/execute` proxy route, call from frontend, keep key server-side
   - All three flagged this.

4. **Migrate session store to PostgreSQL**
   - Current: In-memory `Map`, wiped on every deploy
   - Fix: PostgreSQL table (already have the DB)
   - Minimum schema: `id, viewer_token_hash, wallet_address, type, network, status, created_at, expires_at, intent_params_jsonb, reference_key, telegram_chat_id, tx_hash, error_code`
   - Add `sign_session_events` table for audit trail
   - ChatGPT suggested Redis, Perplexity said Postgres is fine since we already have it.

### P1 — Do Before Production

5. **Unify on Jupiter v2 API**
   - Current: Bot uses v2 /order, QR handler uses v1 /quote+/swap
   - Fix: Use v2 everywhere. For QR/Solana Pay, use `/swap-instructions` or `/build` endpoint which gives raw instructions for custom transaction construction.
   - v1 is deprecated per both reviewers.

6. **Fresh transactions for WalletConnect path**
   - Current: Deserializes pre-built tx from session (stale blockhash)
   - Fix: Build fresh `/order` just before signing, same as QR path
   - "WalletConnect should also rebuild or re-order just before signing" — Perplexity

7. **Add referenceKey to WalletConnect path**
   - Current: Only QR path uses referenceKey for confirmation detection
   - Fix: Embed referenceKey in ALL external transactions for unified server-side monitoring
   - ChatGPT: "This allows a unified server-side monitoring system"

8. **Bot notification through agent, not direct Telegram API**
   - Current: Frontend calls Telegram Bot API directly with `sendMessage`
   - Fix: Frontend marks session complete → server emits domain event → bot service consumes event → posts context-aware message into conversation
   - "Bypasses conversation state and creates split-brain" — Perplexity

### P2 — Do For Polish

9. **Retry mechanism for dropped transactions**
   - Offer "Refresh & Resign" button if tx not detected within 30s
   - Rebuild transaction, don't resubmit old one

10. **Dynamic token list**
    - Current: 7 hardcoded tokens in mint map
    - Fix: Use Jupiter's token list API for any verified SPL token

11. **Auth on session GET**
    - Current: Anyone with UUID can read full session data
    - Fix: Add a `viewer_token` (separate from session ID) passed as query param, hashed and compared

12. **CORS tightening**
    - Current: `Access-Control-Allow-Origin: *`
    - Fix: Whitelist `raze.fun` and wallet domains only

13. **Phantom Blowfish whitelisting**
    - Email review@blowfish.xyz to remove "unsafe dApp" warning

---

## Specific Technical Learnings

### Jupiter API
- v2 `/order` + `/execute` is the recommended path — Jupiter handles landing, priority fees, confirmation
- `/order` transactions may include routing modes and partial-sign expectations tailored for `/execute` — don't assume they're portable to wallet-broadcast
- `trackingAccount` is valid for embedding reference keys but verify the built tx actually includes it
- `asLegacyTransaction: true` limits route flexibility — some routes only work with versioned transactions
- v1 `/quote` + `/swap` still works but is deprecated
- `prioritizationFeeLamports: "auto"` helps but doesn't guarantee landing when wallet broadcasts via its own RPC

### Solana Pay
- Spec-compliant shape: `solana:<https-url>` QR, GET returns `{label, icon}`, POST accepts `{account}` returns `{transaction, message}`
- Wallet MUST NOT sign if signatures other than the requesting account are expected
- The spec's formal `reference` mechanism is for transfer requests — our use via `trackingAccount` is a workaround
- `findReference` inconsistencies are caused by: tx didn't land, reference not in indexed instruction, or RPC indexing delay
- Use `confirmed` for UI, `finalized` for backend settlement
- Phantom replaces blockhash before signing (per spec)
- Jupiter wallet doesn't support Solana Pay at all

### WalletConnect / Reown AppKit
- `createAppKit` should be imported from `@reown/appkit` (not `/react`)
- Initialization at module scope works but can crash mobile browsers if not handled
- WalletConnect redirect flow breaks in Telegram's in-app browser (especially Jupiter wallet)
- `SolanaAdapter()` without explicit wallet adapters works — wallet detection is automatic
- `@solana/wallet-adapter-wallets` has React 19 incompatibility (keystonehq dependencies)

### Solana
- Blockhashes expire in ~60-90 seconds (150 slots)
- Versioned transactions + Address Lookup Tables caused "couldn't load" in Phantom's Solana Pay
- Legacy transactions work reliably with Phantom Solana Pay
- `skipPreflight: true` accepts invalid txs into mempool — simulation partially compensates but there's a race window
- `getSignatureStatuses` returns `null` for dropped transactions (they never existed on-chain)

### Railway / Next.js Deployment
- `output: "standalone"` doesn't copy `.next/static` or `public/` — needs postbuild copy
- `HOSTNAME=0.0.0.0` required for standalone server to bind correctly
- `npm start` with standalone shows warning but works; `node .next/standalone/server.js` is correct
- `nixpacks.toml` is the only reliable way to set Node version on Railway
- Deploy from correct directory: `cd frontend && railway up --service frontend`

---

## Target Architecture (v2)

```
User: "swap 1 USDC to SOL"
         │
         ▼
Bot creates INTENT (not transaction)
  → POST /api/sign/sessions {wallet, from, to, amount, chatId}
  → Returns sessionId + viewerToken
  → Bot sends raze.fun/sign/{id}?token={viewerToken}
         │
         ▼
Sign Page fetches intent (auth via viewerToken)
  → Shows swap preview (amount, tokens, network)
  → Two modes:
         │
    ┌────┴────┐
    │         │
  [QR]    [Connect]
    │         │
    │    User connects wallet
    │    Page calls POST /api/sign/{id}/build
    │      → Server calls Jupiter v2 /order (fresh)
    │      → Returns unsigned tx
    │    Wallet signs
    │    Page sends signed tx to POST /api/sign/{id}/submit
    │      → Server calls Jupiter v2 /execute (API key server-side)
    │      → Server verifies on-chain
    │      → Server updates session → notifies bot
    │
  Phantom scans QR
  QR endpoint builds fresh legacy tx (v2 /build or /swap-instructions)
    with trackingAccount
  Phantom signs + broadcasts
  Server polls findReference()
    → Verifies on-chain
    → Updates session → notifies bot
```

Key differences from current:
- **Intent-based sessions** — no pre-built transaction stored
- **Server-side /execute** — Jupiter API key never leaves server
- **Server-side completion** — on-chain verification before marking done
- **Unified v2 API** — both paths use Jupiter v2
- **Auth on all endpoints** — viewerToken for reads, server-only for writes
- **PostgreSQL sessions** — survives deploys, supports audit trail

---

## What NOT to Change

- Reown AppKit for WalletConnect — it works, it's the standard
- Solana Pay QR as mobile fallback — it works with Phantom
- Two-tab UI (QR / Connect) — good UX, just needs unified backend
- `findReference` for QR confirmation detection — correct approach
- Bot inline button for sign link — standard Telegram pattern
- Light purple gradient design — matches brand, looks good

---

## Open Questions

1. Should we use Jupiter v2 `/build` or `/swap-instructions` for the QR path? `/build` gives a full transaction, `/swap-instructions` gives raw instructions we compose ourselves.
2. For the WalletConnect path, should we fetch `/order` from the frontend and sign client-side, or should the server build and the client just sign? The former is simpler, the latter keeps the API key server-side.
3. Should the bot create the session via the frontend API (current), or should it write directly to PostgreSQL? Direct DB write is faster but couples bot to DB schema.
4. Do we need Helius webhooks for confirmation detection, or is polling `findReference` reliable enough for our volume?
