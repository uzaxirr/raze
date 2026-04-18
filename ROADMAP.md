# Raze — Roadmap & Things to Build

## Ready to Build

### PnL Shareable Card
**Priority:** High — viral loop, free marketing every share
**Status:** Designed, not implemented

Users ask "show my PnL" → agent calls `get_wallet_pnl` → agent emits `[PNL_CARD]{json}[/PNL_CARD]` tag → bot generates image → sends as Telegram photo.

**Implementation:**
- `agent_prompt.py` — add `[PNL_CARD]` tag format and trigger instructions
- `backend/tg-bot/src/pnl_card.py` — SVG template + renderer (SVG → PNG via cairosvg)
- `backend/tg-bot/src/bot.py` — detect `[PNL_CARD]` tag in agent response, extract JSON, render card, send as photo
- `requirements.txt` — add `cairosvg`

**Card contents:**
- Raze branding (imp mascot + "raze.fun")
- Total PnL (big green/red number)
- Time period (24h / 7d / 30d / all time)
- Top 3 winners and losers with amounts
- Win rate + total trades
- "Generated via raze.fun" watermark

**Architecture:** SVG template with string replacement → PNG conversion. No frontend dependency, no browser, sub-100ms. Same tag pattern as `[SIGN_TX]`.

---

### Jupiter Swap Fee Verification
**Priority:** High — revenue depends on this
**Status:** Code deployed, needs end-to-end verification

Swap fees (2% / 200 bps) implemented via Jupiter referral program. Need to verify:
- [ ] Swap executes successfully with fee account PDA
- [ ] Fee appears in referral dashboard at referral.jup.ag
- [ ] Works for both internal (Privy) and external (self-custody) signing modes
- [ ] Different output mints route to correct token accounts (SOL, USDC, USDT, etc.)

**Referral Account:** `2sZdpSqnggDWj1xMfrytd4Pum34wBjVW7KtyuknRgkGZ`
**Token accounts created for:** SOL, USDC, USDT, jlUSDC, USD1, JLP

---

### Versioned Transaction Signing Fix
**Priority:** High — blocking external wallet swaps
**Status:** Fix deployed, needs testing

Jupiter v1 API returns versioned (v0) transactions. Signing page at `raze.fun/sign/[id]` updated to detect tx type from first byte prefix. Needs testing:
- [ ] SOL → USDC swap via external wallet (Phantom)
- [ ] Token → Token swap via external wallet
- [ ] SOL transfer via external wallet
- [ ] Verify both versioned and legacy transactions work

---

### Brand Assets Update
**Priority:** Medium
**Status:** HTML templates created, need screenshots

Profile pic and banner HTML generators at:
- `frontend/public/assets/generate-profile.html` (400x400)
- `frontend/public/assets/generate-banner.html` (1500x500)

Open via `localhost:3000/assets/generate-profile.html` and screenshot. Update:
- [ ] Twitter profile picture
- [ ] Twitter banner
- [ ] Telegram bot profile picture (via BotFather `/setuserpic`)

---

## Phase 1 — Solana Agent (Current)

### Agent Personality Tuning
- Agent backs off too hard when roasted — should fire back, not apologize
- Agent sometimes dumps everything in one message — needs better multi-turn pacing
- Response length inconsistent — sometimes too verbose

### Pro Tier
- Define free vs pro feature gates
- Payment mechanism (SOL/USDC subscription)
- Features: unlimited swaps, priority fees, advanced sniper, more alerts/watchlists

### Controlled Agent Policies
- User-defined spending limits per transaction
- Daily/weekly caps
- Token whitelist/blacklist
- Auto-buy rules with safety bounds
- Premium feature tied to pro tier

---

## Phase 2 — Multi-chain

- EVM support (Ethereum, Base, Arbitrum)
- Sui support
- Same Telegram interface, chain detection from token/address format
- MCP architecture makes this extensible — add chain-specific MCP servers

---

## Phase 3 — Autonomous Portfolio Management

- User-defined policies ("buy if momentum > 7 and security score > 6")
- Raze executes within bounds without asking
- Stop-loss / take-profit automation
- Rebalancing strategies
- Requires controlled agent policies from Phase 1

---

## Phase 4 — External Integrations + Gamification

- Users connect third-party apps via their own MCP servers (BYOMCP already built)
- Raze as personal crypto assistant beyond trading
- Gamification: reward good decisions, penalize bad ones
- Leaderboards, streaks, achievements
- Additional revenue stream from gamification features

---

## Infrastructure / Tech Debt

- [ ] Delete helius-mcp Railway service (no longer used)
- [ ] Remove dead code: `CTAFooter.tsx`, `GhostSVGs.tsx`, ghost CSS keyframes
- [ ] GitHub Dependabot: 10 vulnerabilities (3 high, 4 moderate, 3 low)
- [ ] `get_program_idl` tool orphaned after read-mcp retirement — move to utility server or remove
- [ ] Backend architecture review — MCP-heavy design vs direct tool-calling still open
- [ ] Agent memory: `enable_user_memories=False` due to Claude Sonnet not supporting structured outputs — revisit when model supports it
