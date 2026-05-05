# Raze — Product Strategy & Use Case Prioritization

> Consolidated from two deep research reports (April 2026):
> - `raze-trader-workflows.md` — 20+ use cases with behavioral evidence from Reddit, CT, GitHub
> - `raze-25-use-cases.md` — 25 use cases with competitive analysis across Solana, Ethereum, Base

---

## Three Strategic Moats

### 1. Research + Execution in One Interface
Every competitor is research-only (DexScreener, Birdeye, LunarCrush) OR execution-only (BonkBot, Trojan). Raze does both in a single conversation. The "6-tab DYOR" problem is the #1 pain point in Solana trading.

### 2. Cross-Data Intelligence
No tool cross-references security + sentiment + whale activity + governance + portfolio context. Each data source alone is commodity. The intelligence emerges from combining them. This requires integrating 5+ data providers and an AI layer that synthesizes meaningfully.

### 3. Personality as Product
BonkBot (519K users) and Trojan (2M users) have zero personality. Raze's sarcastic persona creates retention and virality. In group chats, personality becomes entertainment, making Raze sticky in ways pure utility tools never are.

---

## Competitive Landscape (April 2026)

| Player | Category | Users | NL Chat | Research | Alerts | Personality |
|--------|----------|-------|---------|----------|--------|-------------|
| Trojan | TG trade bot | 2.0M | — | — | — | — |
| BonkBot | TG trade bot | 519K | — | — | — | — |
| Axiom/Photon | Web terminal | n/a | — | partial | — | — |
| GMGN/BullX | Discovery+trade | n/a | — | ✓ | — | — |
| SolClaw | AI agent TG | new | ✓ | — | — | — |
| Tragent | AI copilot (web) | new | ✓ | partial | — | — |
| Let's Boogie | AI TG bot | new | partial | — | — | — |
| **Raze** | AI-native chat | beta | ✓ | ✓ | ✓ | ✓ |

---

## Prioritized Roadmap

### Tier 1 — Ship This Week (highest impact, current architecture supports)

| Feature | Use Case | Why Now |
|---------|----------|---------|
| **Morning Market Briefing** | "give me a solana morning briefing" → overnight whale moves, trending tokens, unusual activity | Zero competitors. One message. Massive retention hook — users come back daily. |
| **Group Chat Mode** | Add @razeaii_bot to a group → shared research assistant | #1 viral growth mechanic. No competitor has this. Creates network effects within trading communities. |
| **Trailing Stop-Loss** | "set trailing stop at 15% from peak on $WIF" → monitors price, auto-sells when triggered | No Solana DEX or bot offers this. Traders literally stay awake watching charts. |
| **DCA via Chat** | "buy 1 SOL of BONK every day for 7 days" | BonkBot/Trojan have zero DCA. Each DCA = 7 swap fee events = 7x revenue per user action. |

### Tier 2 — Build Next (moat builders)

| Feature | Use Case | Why |
|---------|----------|-----|
| **Smart Money Convergence** | Watch N wallets, alert when 3+ buy the same token | $500/mo alpha group value for free. Pure cross-data intelligence. |
| **Sentiment vs On-Chain Divergence** | Find tokens where CT is bearish but whales accumulating | Alpha that only exists in the cross-reference. No single tool does this. |
| **Deployer Forensics** | "check the deployer — have they launched other tokens?" | Chain deployer history automatically. 100% rug rate detection. |
| **Portfolio Risk Analysis** | Exposure concentration, deployer overlap, correlation warnings | Completely unserved market. No tool does portfolio-level risk on Solana. |
| **Copy Trading with Context** | "toly.sol just bought something — what and why?" | Copy tools show WHAT, never WHY. Raze adds governance context, advisor relationships, correlated wallets. |

### Tier 3 — Differentiation Features

| Feature | Use Case | Why |
|---------|----------|-----|
| **Emergency Wallet Evacuation** | One-message sweep to new wallet during drain | Life-saving. Low frequency but extreme loyalty driver. Users who get saved become evangelists. |
| **MEV Protection Check** | "check my last 10 swaps — was I getting frontrun?" | Retail loses millions to sandwiches without knowing. Zero consumer tools for this. |
| **DAO Vote Digest** | "any governance votes for tokens I hold?" | Realms UX too friction-heavy. Conversational voting could 10x participation. |
| **Tax Snapshot** | "roughly how much do I owe in taxes this year?" | New IRS per-wallet cost basis rule (Jan 2026). $279/yr Koinly alternative. |
| **Yield Optimizer** | "50 SOL doing nothing — where should I put it?" | Compare Jito/Marinade/marginfi/Kamino/Orca in one message with risk context. |
| **cNFT Portfolio Manager** | "scan my cNFTs — anything valuable?" | Compressed NFTs poorly supported. Most users don't know what they have. |

### Tier 4 — Later

| Feature | Why Later |
|---------|-----------|
| Multi-chain (Base, ETH) | Focus on Solana dominance first |
| Mobile app | Telegram is the distribution channel |
| Portfolio rebalancing | Requires multiple swap orchestration |
| Airdrop farming coach | Needs protocol-specific integration work |
| Health monitoring for leveraged DeFi | Requires deep protocol API integration |

---

## Key Market Data

- **$70M+** daily Telegram bot trading volume on Solana
- **~70%** of all Telegram bot volume happens on Solana
- **$65B+** lifetime top-5 bot volume
- **0** existing bots are natural-language / AI-native
- **98.7%** of pump.fun tokens are rugs — security scanning is existential
- **84%** of Solana launches have sniper activity in first 5 seconds
- Axiom went **0 → 57% market share** in 2 months — traders switch instantly

---

## Revenue Model

Every feature generates transactions → revenue:

| Feature | Revenue Mechanism |
|---------|-------------------|
| Swaps | 2% Jupiter referral fee |
| Sends/Transfers | 1% transfer fee |
| DCA | 2% per scheduled swap × N days |
| Copy Trading | 2% per copied swap |
| Trailing Stop | 2% on exit swap |
| Rebalancing | 2% per rebalance swap (5-10 per rebalance) |
| Yield Actions | 2% on staking/LP deposits |

**DCA alone turns 1 user decision into 7+ swap fee events.**
**Rebalancing turns 1 user decision into 5-10 swap fee events.**

---

## Unserved Niches in Solana Tooling

1. **Conversational Risk Management** — No trailing stops, exposure limits, correlation warnings, or auto-rebalancing exists on Solana
2. **Group Intelligence Layer** — Zero shared tooling in trading groups. No aggregate portfolio, shared research, or group leaderboards
3. **Cross-Protocol Yield Intelligence** — No real-time comparison of yields across Jito/Marinade/marginfi/Kamino/Orca with risk context
4. **Emergency Response Tooling** — No one-message wallet evacuation. The "golden hour" after compromise determines total loss vs partial save
5. **Governance Participation Layer** — DAO participation extremely low despite millions in governance tokens. UX friction too high
6. **MEV Awareness for Retail** — Retail loses millions to sandwich attacks without knowing. No consumer tool analyzes this

---

## Social Proof / Evidence Sources

### Reddit Threads (real user frustration)
- r/SolCoins: "Finally streamlined my Solana trading workflow" — 7-step multi-tool process
- r/solana: "What's stopping these Telegram bots from stealing your funds?" — 180+ comments on custodial risk
- r/defi: "Solana Airdrop Checkers in 2026?" — fragmentation complaints
- r/CryptoTax: "Which crypto tax software do you actually use?" — Solana DeFi parsing failures
- r/solana: "Is there a DEX that supports stop-loss?" — stop-loss doesn't exist on Solana

### Key Stats
- Cielo Whale costs $199/mo but has NO PnL analytics — users build spreadsheets
- 75.3% of Solana transactions failed on April 4, 2024 during congestion
- BonkBot enforces 1 wallet per Telegram account — traders create multiple accounts
- Koinly caps at 50,000 txns per wallet — high-frequency Solana traders exceed this

---

## Source Reports

- `docs/raze-trader-workflows.md` — Full Perplexity research with 71 references
- `docs/raze-25-use-cases.md` — 25 detailed use cases with example conversations
- `.omc/scientist/reports/20260424_230054_raze_use_cases.md` — Scientist agent findings
- `.omc/scientist/reports/20260420_1226_solana_trader_workarounds.md` — Workaround research
