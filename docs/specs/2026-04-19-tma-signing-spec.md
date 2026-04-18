# Spec: Telegram Mini App Signing Flow

## Problem
External wallet signing requires 4 context switches (Telegram → browser → wallet → Telegram), has a 120s TTL, no feedback loop, and broken mobile UX. No major Telegram trading bot has solved this.

## Solution
Replace the current `raze.fun/sign/[id]` flow with a **Telegram Mini App + Reown AppKit (WalletConnect)**.

## Architecture

```
User (Telegram) → "swap 1 sol to usdc"
    → Bot creates unsigned tx
    → Bot stores SWAP PARAMS (not serialized tx) in Redis/DB with UUID
    → Bot sends inline keyboard button: [Sign Transaction] (opens TMA)
    → TMA opens inside Telegram as overlay panel
    → TMA fetches swap params from /api/tma/sign/{uuid}
    → TMA uses Reown AppKit to connect wallet (WalletConnect)
        - Desktop: detects extensions or QR code
        - Mobile: deep links to wallet app for approval
    → TMA rebuilds fresh transaction with current blockhash
    → User signs in wallet
    → TMA broadcasts signed tx to Solana
    → TMA POSTs result to /api/tma/sign/{uuid}/complete
    → Bot receives callback, confirms in chat with tx link
```

## What Changes

### Remove (current signing flow)
- `frontend/src/app/sign/[id]/page.tsx` — current signing page
- `frontend/src/app/api/sign/route.ts` — in-memory tx store (POST/GET)
- `bot.py` — `extract_sign_tx` function that stores tx via frontend API
- `bot.py` — signing page URL generation logic
- `agent_prompt.py` — `[SIGN_TX]` tag format (replace with new tag)

### Create (new TMA signing flow)
- `frontend/src/app/tma/sign/[id]/page.tsx` — Telegram Mini App signing UI
- `frontend/src/app/api/tma/sign/route.ts` — transaction session store (swap params, status tracking)
- `frontend/src/app/api/tma/sign/[id]/complete/route.ts` — callback endpoint for signed tx
- Register Mini App with BotFather

### Modify
- `bot.py` — send inline keyboard with `web_app` URL instead of regular URL
- `agent_prompt.py` — update signing mode instructions (no more `[SIGN_TX]` tag, agent just confirms and bot handles the button)
- `main.py` — no changes needed

## Key Decisions

### Store swap params, not serialized transactions
- Store: `{inputMint, outputMint, amount, slippageBps, walletAddress, signingMode}`
- Rebuild transaction fresh when user connects wallet in TMA
- Eliminates blockhash expiry problem entirely
- Longer TTL (5-10 min) since params don't expire

### Reown AppKit for wallet connection
- `@reown/appkit` + `@reown/appkit-adapter-solana`
- Pure JS — no node-gyp/USB dependencies
- Supports Phantom, Backpack, Solflare, Jupiter via WalletConnect
- Session persists — user connects once, signs many
- Free project ID from cloud.reown.com

### Feedback loop
- TMA POSTs to `/api/tma/sign/{uuid}/complete` with txHash
- Backend updates session status: pending → connected → signing → completed/expired
- Bot polls `/api/tma/sign/{uuid}/status` (every 2-3s, short lifecycle)
- Bot sends confirmation in chat: "Transaction confirmed! [View on Solscan]"

### Keep existing `/sign/[id]` as fallback?
- NO — delete it. One flow, not two. Simplifies codebase.
- If TMA doesn't work for edge cases, user can switch to internal mode.

## Packages
```
@reown/appkit
@reown/appkit-adapter-solana
@telegram-apps/sdk (optional, for theme integration)
@solana/web3.js (already installed)
```

## Env Vars
- `REOWN_PROJECT_ID` — from cloud.reown.com (add to frontend .env)

## Bot Changes (bot.py)

### Before (current)
```python
# Agent emits [SIGN_TX]{base64_tx}[/SIGN_TX]
# Bot extracts, stores at raze.fun/api/sign, sends URL
```

### After (new)
```python
# Agent returns swap result with status: "pending_signature"
# Bot detects pending_signature in response
# Bot stores swap params at /api/tma/sign (POST)
# Bot sends inline keyboard with web_app button opening TMA
# Bot polls for completion, sends confirmation when done
```

## TMA UI (compact, fits Mini App panel)
```
┌─────────────────────────┐
│ raze                    │
│                         │
│ Swap 1 SOL → USDC      │
│ ~$90.24 · 0.5% slip    │
│                         │
│ [Connect Wallet]        │ ← Reown AppKit button
│                         │
│ or                      │
│ [Sign with Phantom]     │ ← deep link fast path (Phase 2)
│                         │
│ expires in 4:32         │
└─────────────────────────┘
```

After connecting:
```
┌─────────────────────────┐
│ Connected: D4M5...YqpJ  │
│                         │
│ Swap 1 SOL → USDC      │
│ ~$90.24 · 0.5% slip    │
│ Fee: 0.02 SOL (2%)     │
│                         │
│ [Sign & Send]           │
│                         │
└─────────────────────────┘
```

## Gotchas
- Call `Telegram.WebApp.expand()` on mount to maximize Mini App height
- WalletConnect relay adds ~1-2s latency on first connection
- CSP must allow `wss://relay.walletconnect.com`
- Mobile: wallet app opens for approval, user manually returns to Telegram (1 context switch vs current 4)
- Verify `@reown/appkit-adapter-solana` has no node-gyp transitive deps before deploying
- WalletConnect sessions expire after ~7 days — handle gracefully
