# RAZE
## 25 Use Cases for the AI Agent That Replaces 6 Tabs

**raze.fun | @razeaii_bot**

*Deep Research Report — April 2026*

*Behavioral evidence from real trader workflows, Reddit threads, CT discussions, and competitive analysis across Solana, Ethereum, and Base ecosystems.*

---

# Executive Summary

This report documents 25 specific, evidence-backed use cases where Raze creates unique value that no existing tool provides. Each use case is grounded in real trader behavior observed across Reddit, Crypto Twitter, GitHub issues, and trading community discussions.

The core insight: Solana traders today juggle 5-8 separate tools for a single trade decision. Raze collapses this multi-tab workflow into conversational AI that researches, opinionates, and executes — all without leaving Telegram.

**Key findings:**

- **Pre-trade research** is the biggest friction point. The '6-tab DYOR' workflow (DexScreener + RugCheck + Birdeye + BubbleMaps + LunarCrush + whale tracker) takes 10+ minutes per token. Raze does it in one message.
- **Risk management** is completely unserved. No Solana tool offers trailing stops, exposure analysis, or portfolio rebalancing. Traders manage risk via vibes and hope.
- **Group chat dynamics** are a blue ocean. Trading groups have zero shared tooling. Raze as a group research assistant creates an entirely new product category.
- **Emergency response** tooling doesn't exist. Wallet compromises result in total loss because there's no one-message evacuation tool. This is a life-safety feature.
- **Self-custody** is Raze's trust differentiator. Reddit threads show deep distrust of custodial bots (BonkBot, Trojan). Raze's WalletConnect integration solves this.

---

# Section 1: Pre-Trade Research Workflows (Use Cases 1–4)

What traders do BEFORE buying — the highest-friction phase of the trading workflow.

---

## 1. One-Message DYOR: Full Token Audit Before Aping

**Scenario:** A degen spots a new token on CT (Crypto Twitter). Before aping, they need to check: mint authority, LP status, top holders, bundle detection, social sentiment, and whale activity. Currently this takes 5+ tabs and 10+ minutes.

> **User:** "full dyor on $POPCAT"

> **Raze:** "alright here's your $POPCAT deep dive:
>
> mint authority: REVOKED. lp: burned, 98.2% locked. top 10 holders: 14.7% (clean spread). bundles: 2 detected at launch, both exited. dev wallet: sold 0%. sentiment (lunarcrush): 87/100 bullish, 4.2k mentions/24h. whale activity: toly.sol bought 420 SOL worth 6h ago. smart money inflow: +$2.1M/24h.
>
> verdict: cleaner than most. the whale entry is interesting. not financial advice but i'd watch that toly position closely."

**Why this is painful without Raze:** Traders currently open RugCheck for security, Birdeye for holders, BubbleMaps for bundle detection, LunarCrush for sentiment, and a whale tracker separately. Each tool has its own UI, no cross-referencing. The 2-Minute Memecoin Checklist (DEXTools, 2026) documents this exact 6-step manual process that traders must complete before every single trade.

**Tools needed without Raze:** RugCheck + Birdeye + BubbleMaps + LunarCrush + Whale tracker + DexScreener (6 tabs minimum)

---

## 2. Deployer Wallet Forensics: Is This Dev a Serial Rugger?

**Scenario:** A trader finds a promising token but wants to know the deployer's history. Have they launched other tokens? Did those rug? What's their pattern?

> **User:** "check the deployer of $LUNA2 - have they launched other tokens?"

> **Raze:** "deployer wallet: 7xKp...3mNq
>
> previous launches:
> 1. $FAKEMOON (3 weeks ago) - LP pulled after 4h, 94% down
> 2. $SAFERUG (2 weeks ago) - mint authority used to print 400M tokens
> 3. $LUNA2 (current) - mint authority still ENABLED
>
> this deployer has a 100% rug rate. the mint authority is still live on $LUNA2. run. don't walk. run."

**Why this is painful without Raze:** No existing tool chains deployer history automatically. Traders must manually copy the deployer address from Solscan, search previous token deployments, then individually check each token's outcome. DaybreakScan (2026) highlights deployer profiling as the #1 missed step in rug detection.

**Tools needed without Raze:** Solscan + manual address tracing + RugCheck on each previous token + spreadsheet tracking

---

## 3. Smart Money Convergence Alert: Multiple Whales Entering Same Token

**Scenario:** Trader watches 5 whale wallets. When 3+ buy the same token within a short window, it's a strong signal. Currently impossible to detect without custom code.

> **User:** "watch these 5 wallets and alert me when 3 or more buy the same token within 1 hour"

> **Raze:** "got it. monitoring 5 wallets for convergence signals.
>
> [2 hours later]
>
> CONVERGENCE ALERT: 3/5 watched wallets just bought $SHARK within 47 minutes:
> - toly.sol: 200 SOL ($28K)
> - whale2.sol: 150 SOL ($21K)
> - whale3.sol: 500 SOL ($70K)
>
> total smart money inflow: $119K. token is 12 minutes old, $340K mcap. security: mint revoked, LP burned, clean holders.
>
> this is the kind of signal people pay $500/mo alpha groups for. you're welcome."

**Why this is painful without Raze:** No tool offers multi-wallet convergence detection. Traders either pay for expensive alpha groups ($200-500/mo) or manually check each tracked wallet one by one. Cielo Finance and similar trackers show individual wallet activity but cannot cross-reference across wallets to detect convergence patterns.

**Tools needed without Raze:** Cielo Finance + manual cross-referencing OR $200-500/mo alpha group subscription

---

## 4. Sentiment vs. On-Chain Divergence: The Smart Contrarian Play

**Scenario:** Social media is extremely bearish on a token, but on-chain data shows accumulation. This divergence often precedes a reversal. No tool combines both data streams.

> **User:** "find tokens where social sentiment is bearish but whales are accumulating"

> **Raze:** "found 3 divergence plays right now:
>
> 1. $BONK - sentiment: 32/100 (fear), but 4 wallets with 10K+ SOL accumulated $1.2M in 48h. classic fear accumulation.
> 2. $ORCA - CT hates it after the UI update, sentiment 28/100. meanwhile protocol TVL up 18% this week and 3 smart wallets added LP.
> 3. $PYTH - sentiment dropped to 41/100 after unlock FUD. insider wallets haven't sold a single token.
>
> contrarian plays are how you make money when everyone else is crying. the crowd is usually wrong at extremes."

**Why this is painful without Raze:** No single tool merges social sentiment data with on-chain whale accumulation patterns. Traders would need to manually compare LunarCrush sentiment scores against Arkham/Nansen-style wallet tracking and mentally correlate the patterns. This is pure alpha that exists only in the cross-reference.

**Tools needed without Raze:** LunarCrush + Arkham/Nansen + DexScreener + manual correlation + spreadsheet

---

# Section 2A: Post-Trade Monitoring (Use Cases 5–7)

What traders do AFTER buying — the phase where most profits are lost.

---

## 5. Active Position Manager: Trailing Stop-Loss via Chat

**Scenario:** Trader bought a memecoin and wants a trailing stop-loss, but no Solana DEX offers native stop-losses. They need to manually watch charts or miss the exit.

> **User:** "I bought $WIF at $2.10. set a trailing stop at 15% from peak"

> **Raze:** "trailing stop set for $WIF:
> - entry: $2.10
> - current: $2.10
> - trailing stop: 15% from highest price
> - trigger price: $1.785 (adjusts upward as price rises)
>
> [6 hours later]
>
> $WIF hit $3.40 then started dropping. trailing stop triggered at $2.89. sold your full position.
>
> entry: $2.10, exit: $2.89. profit: +37.6%.
>
> you're welcome. most people would've held to zero hoping for another pump. not you though. you're evolved."

**Why this is painful without Raze:** No Solana trading bot offers trailing stop-losses. Jupiter has no conditional orders. Traders literally set alarms on TradingView and manually execute sells. The Reddit thread 'Finally streamlined my Solana trading workflow' (r/SolCoins, 2025) describes traders losing profits because they couldn't exit positions while sleeping.

**Tools needed without Raze:** TradingView alerts + manual Jupiter execution + staying awake 24/7

---

## 6. Real-Time Rug Detection: Get Out Before Everyone Else

**Scenario:** Trader holds a token and LP suddenly starts getting removed, or mint authority is used. They need instant alerts, not a post-mortem.

> **User:** "monitor $SHDW for any suspicious activity - LP removal, mint events, large insider sells"

> **Raze:** "monitoring $SHDW for threat signals.
>
> [45 minutes later]
>
> EMERGENCY: $SHDW threat detected:
> - dev wallet just removed 34% of LP ($180K)
> - 2 insider wallets sold within 90 seconds of LP removal
> - price impact: already -22%
>
> recommendation: EXIT NOW. this is textbook LP rug sequence.
>
> want me to sell your position immediately?"

**Why this is painful without Raze:** RugBuster (rugbuster.fun) offers post-hoc rug detection but not real-time monitoring. By the time traders check RugCheck or see the alert on CT, the price has already cratered 80%+. The Solana Wallet Drainer Recovery guide (CryptoRecoveryExpertAgency, 2025) documents that most victims had zero warning before drains.

**Tools needed without Raze:** RugBuster (after the fact) + hope + prayer

---

## 7. Portfolio Rebalancing: Natural Language Asset Allocation

**Scenario:** Trader realizes they're 80% in memecoins and wants to rebalance to a 50/30/20 split (meme/DeFi/stables). Currently requires multiple manual swaps.

> **User:** "rebalance my portfolio to 50% memecoins, 30% DeFi tokens (JUP, RAY, ORCA), 20% USDC"

> **Raze:** "current portfolio: $4,200 total
> - memecoins: $3,360 (80%) - needs to go to $2,100
> - DeFi: $420 (10%) - needs to go to $1,260
> - USDC: $420 (10%) - needs to go to $840
>
> rebalancing plan:
> - sell $1,260 of memecoins (proportional across positions)
> - buy $280 each of JUP, RAY, ORCA
> - swap $420 to USDC
>
> total: 7 transactions. estimated fees: $0.14
>
> confirm to execute? honestly surprised you want to be responsible for once."

**Why this is painful without Raze:** No Solana tool offers portfolio rebalancing. Traders manually calculate targets, then execute 5-10 individual swaps on Jupiter. Each swap requires route finding, slippage setting, and confirmation. A 7-token rebalance takes 15-20 minutes of manual work.

**Tools needed without Raze:** Calculator + Jupiter (multiple manual swaps) + Birdeye (portfolio view) + patience

---

# Section 2B: Risk Management (Use Cases 8–9)

Active risk management tools that don't exist anywhere in Solana tooling today.

---

## 8. Exposure Concentration Alert: Don't Get Overexposed

**Scenario:** A trader keeps buying different memecoins but doesn't realize that 3 of them share the same deployer, or that 60% of their portfolio is in tokens launched in the last 48 hours.

> **User:** "analyze my risk exposure - am I overexposed to anything?"

> **Raze:** "portfolio risk report:
>
> concentration risk:
> - 67% of portfolio in tokens < 48h old (extremely risky)
> - 3 tokens ($DOGE2, $CATGPT, $MOONAI) share deployer wallet 4xRt...mN2
> - 40% exposure to tokens with mint authority still enabled
>
> correlation risk:
> - $WIF, $BONK, $POPCAT move 92% correlated. you basically have 1 position in 3 wrappers.
>
> liquidity risk:
> - $MICROCAT has $12K total liquidity. your $800 position is 6.7% of pool. exiting will cause 8%+ slippage.
>
> you're basically playing russian roulette with 4 bullets. want me to suggest a safer allocation?"

**Why this is painful without Raze:** No tool performs portfolio risk analysis combining deployer overlap, token age, mint authority status, correlation analysis, and liquidity depth. Traders don't even know this analysis exists. The Memecoin Traps Checklist (degensyntax.com) identifies shared deployer wallets as a top-5 risk that almost nobody checks.

**Tools needed without Raze:** Manual deployer checking on each token + correlation math + liquidity depth checking on Birdeye + spreadsheet

---

## 9. Impermanent Loss Tracker for LP Positions

**Scenario:** A user providing liquidity on Raydium or Orca wants to know their actual PnL including impermanent loss, fees earned, and token price changes. Currently requires manual calculation.

> **User:** "how's my USDC/SOL LP position on Orca doing? am I actually profitable?"

> **Raze:** "your USDC/SOL concentrated LP on Orca:
>
> deposited: 5 SOL + 750 USDC ($1,500 total) 12 days ago
> current value: $1,423
>
> breakdown:
> - impermanent loss: -$142 (SOL moved 18% since deposit)
> - fees earned: +$67.30 (4.5% APR equivalent)
> - net PnL: -$74.70 (-4.98%)
>
> you'd have $1,497 if you just held. LP isn't always the move.
>
> want me to remove the LP? or wait - fees are $5.6/day. you'll break even in ~13 more days if SOL stays flat."

**Why this is painful without Raze:** Orca and Raydium show current position value but don't calculate IL against a hold-only baseline. Traders use external IL calculators with manual price inputs. The Solana DeFi Returns guide (Solana Compass, 2025) notes that most LP providers don't actually know if they're profitable.

**Tools needed without Raze:** Orca UI + external IL calculator + manual price lookups + spreadsheet tracking

---

# Section 2C: Social & Group Dynamics (Use Cases 10–11)

How Raze transforms trading groups from chat rooms into collaborative intelligence platforms.

---

## 10. Group Chat Alpha Bot: Shared Research for Trading Groups

**Scenario:** A Telegram trading group of 50 people constantly asks 'is X safe?' or 'what's the sentiment on Y?' One person's research benefits everyone. Raze in a group chat becomes a shared research assistant.

> **User:** "@razeaii_bot dyor $ZEUS" *(sent in group chat)*

> **Raze:** "$ZEUS full scan (requested by @degen_mike):
>
> mint: REVOKED. LP: burned. top holder: 4.2%. bundles: 0 detected. dev wallet: holding, no sells. sentiment: 71/100 neutral-positive. 24h volume: $890K.
>
> clean enough for a gamble. dev is diamond-handing which is either conviction or they're waiting for higher exit. take that how you want.
>
> (12 group members viewed this scan)"

**Why this is painful without Raze:** In trading groups today, one person does research and pastes screenshots from 5 different tools. Others can't verify easily. There's no shared, real-time research layer. The Bitget guide on crypto alpha groups (2026) describes how alpha groups rely on manual screenshots and trust, with no verification layer.

**Tools needed without Raze:** One person manually researching + screenshots + trust + everyone else re-doing the same research independently

---

## 11. Group Consensus Tracker: What Is the Group Actually Holding?

**Scenario:** A trading group wants to see aggregate exposure - what tokens does the group collectively hold? Who's up, who's down? Creates accountability and shared alpha.

> **User:** "@razeaii_bot show group portfolio leaderboard"

> **Raze:** "GROUP PORTFOLIO LEADERBOARD (14 wallets connected):
>
> most popular holds:
> 1. $WIF - 11/14 members hold (avg entry $1.80)
> 2. $JUP - 8/14 members (avg entry $0.92)
> 3. $BONK - 7/14 members (avg entry $0.000012)
>
> PnL leaderboard (7d):
> 1. @sarah_trades: +142% (early $POPCAT)
> 2. @degen_mike: +67% ($WIF swing)
> 3. @ngmi_andy: -34% (bought $RUGCOIN top)
>
> @ngmi_andy your portfolio is a crime scene. we need to talk."

**Why this is painful without Raze:** No tool offers group-level portfolio aggregation. Each member tracks individually. Trading groups have zero shared visibility into collective positions, creating information asymmetry within the group itself.

**Tools needed without Raze:** Every member manually sharing positions + trust + no aggregate view exists anywhere

---

# Section 2D: Airdrop Hunting (Use Cases 12–13)

The multi-billion dollar airdrop economy and how Raze automates the farming workflow.

---

## 12. Airdrop Farming Coach: Guided Protocol Interaction

**Scenario:** A user wants to farm a potential airdrop from an upcoming Solana protocol. They need to know which actions to take, track their progress, and optimize for eligibility. The Reddit thread 'Solana Airdrop Checkers in 2026' (r/defi) describes exactly this need.

> **User:** "help me farm the Tensor airdrop. what do I need to do?"

> **Raze:** "tensor airdrop farming checklist based on their points system + what worked for similar airdrops:
>
> completed:
> - wallet connected to tensor: YES
> - NFT listed: NO
> - NFT purchased: NO
> - collection offer made: NO
> - loyalty points: 0
>
> recommended actions (ordered by effort/reward):
> 1. list 1 NFT on tensor (costs nothing, signals usage)
> 2. buy 1 cheap cNFT from a trending collection (~0.1 SOL)
> 3. place 3 collection offers (can lowball, costs nothing)
> 4. use tensor daily for 30 days (consistency matters)
>
> estimated cost: 0.15 SOL. potential airdrop value based on comps: $200-2,000.
>
> want me to execute step 1? I can list your cheapest NFT right now."

**Why this is painful without Raze:** Airdrop farming currently requires following 10+ Twitter threads, manually tracking actions across protocols, and remembering to interact regularly. Drops.bot and SolanaGuides track eligibility but don't guide actions or execute them. The Coingabbar Solana Airdrops Farming Guide (2026) is a 20-step manual process.

**Tools needed without Raze:** Twitter alpha threads + Drops.bot (checker only) + manual protocol interactions + reminder app + spreadsheet

---

## 13. Airdrop Eligibility Multi-Wallet Check

**Scenario:** A user has 4 wallets and wants to check which are eligible for upcoming airdrops across all major protocols. Currently requires connecting each wallet to each checker individually.

> **User:** "check all my wallets for any pending airdrops"

> **Raze:** "airdrop scan across 4 connected wallets:
>
> wallet 1 (main):
> - Jupiter Season 2: ELIGIBLE (412 points, est. ~$340)
> - Tensor: NOT ELIGIBLE (need NFT activity)
> - Drift: ELIGIBLE (used 3x, low tier)
>
> wallet 2 (degen):
> - Jupiter Season 2: ELIGIBLE (89 points, est. ~$70)
> - Marginfi: ELIGIBLE (deposited, high tier)
>
> wallet 3 & 4: no eligibility detected.
>
> total estimated airdrop value: ~$500-800
>
> wallet 1 is 2 interactions away from drift high tier. want me to place a small perp trade?"

**Why this is painful without Raze:** Each airdrop checker (Drops.bot, SolanaGuides, etc.) requires connecting one wallet at a time to one protocol checker at a time. 4 wallets x 10 protocols = 40 manual checks. Nobody actually does this comprehensively.

**Tools needed without Raze:** Drops.bot + SolanaGuides + individual protocol sites (40+ manual wallet connections)

---

# Section 2E: NFT & cNFT Management (Use Case 14)

---

## 14. cNFT Portfolio Manager: Track Compressed NFTs Nobody Else Shows

**Scenario:** A user received thousands of compressed NFTs (cNFTs) from airdrops and mints but has no idea which are valuable. Phantom barely shows them. No tool gives a comprehensive cNFT valuation.

> **User:** "scan my cNFTs - anything valuable in there?"

> **Raze:** "scanned 2,847 cNFTs in your wallet:
>
> actually valuable (floor price > 0.01 SOL):
> 1. Mad Lads cNFT Companion #4,201 - floor: 2.4 SOL ($360)
> 2. Tensorian #12,887 - floor: 0.8 SOL ($120)
> 3. Drip S3 rare edition - floor: 0.3 SOL ($45)
>
> worth listing:
> 4-12: various Drip drops, total floor ~0.5 SOL
>
> spam/worthless: 2,835 cNFTs (98.6%)
>
> you're sitting on ~$540 in cNFTs you forgot about. that's more than your trading PnL this month. awkward.
>
> want me to list the top 3 on Tensor?"

**Why this is painful without Raze:** Compressed NFTs are poorly supported across the ecosystem. Phantom shows them but with no valuation. Tensor shows listings but doesn't scan your full cNFT collection proactively. Metaplex Bubblegum V2 docs (2026) note the lack of consumer tooling for cNFT portfolio management.

**Tools needed without Raze:** Phantom (basic view) + Tensor (manual listing check) + Helius DAS API (developer-only) + manual floor price lookups

---

# Section 2F: DeFi Yield Optimization (Use Case 15)

---

## 15. Yield Optimizer: Find the Best Return for Idle Assets

**Scenario:** Trader has 50 SOL sitting idle and wants the best risk-adjusted yield. Comparing Marinade, Jito, marginfi, Kamino, and others across staking, lending, and LP requires checking 8+ protocols individually.

> **User:** "I have 50 SOL doing nothing. where should I put it?"

> **Raze:** "yield comparison for 50 SOL right now:
>
> liquid staking (lowest risk):
> - Jito jitoSOL: 7.8% APY + MEV rewards (~1.2% extra)
> - Marinade mSOL: 7.2% APY
> - pick: jitoSOL edges out with MEV
>
> lending (medium risk):
> - marginfi: 9.4% APY (supply utilization 67%)
> - Kamino: 8.8% APY
> - pick: marginfi if you're ok with smart contract risk
>
> LP (higher risk):
> - Orca SOL/USDC concentrated: 18-24% APR (IL risk)
> - Raydium SOL/JitoSOL: 12% APR (low IL, correlated pair)
> - pick: SOL/JitoSOL for risk-adjusted
>
> my take: jitoSOL for 7.8% no-brainer passive. or split: 30 SOL jitoSOL + 20 SOL marginfi lending for blended 8.4% APY.
>
> want me to stake? one message and it's done."

**Why this is painful without Raze:** The Solana DeFi Returns guide (Solana Compass, 2025) documents 15+ yield sources but traders must manually check each protocol's UI. Rate changes daily. No aggregator gives a single natural-language comparison with risk context. Solana liquid staking market analysis (ainvest, 2026) highlights liquidity fragmentation as a core user pain point.

**Tools needed without Raze:** Jito app + Marinade app + marginfi UI + Kamino UI + Orca UI + Raydium UI + DeFiLlama yields page + manual comparison

---

# Section 2G: Tax & Accounting (Use Case 16)

---

## 16. Tax Snapshot: Quick Estimated Tax Liability Check

**Scenario:** Tax season is coming. Trader has 200+ transactions across Jupiter swaps, NFT trades, staking rewards, and airdrops. They want a rough idea of their tax liability before paying $300+ for Koinly.

> **User:** "rough estimate - how much do I owe in taxes this year?"

> **Raze:** "tax estimate for 2025 (US, short-term capital gains):
>
> total realized gains: $4,230
> total realized losses: -$1,890
> net taxable: $2,340
>
> breakdown:
> - jupiter swaps: +$3,100 gains, -$1,200 losses
> - NFT sales: +$630 gains, -$690 losses
> - airdrop income: $500 (taxed as ordinary income at receipt)
> - staking rewards: ~$180 (ordinary income)
>
> estimated tax (25% bracket): ~$585-750
>
> harvesting opportunity: you have $420 in unrealized losses on $BONK. selling before Dec 31 saves ~$105 in taxes.
>
> CAVEAT: this is an estimate, not tax advice. for exact numbers, export to Koinly/CoinLedger. want me to generate a transaction CSV for your tax software?"

**Why this is painful without Raze:** Reddit r/CryptoTax (2025) is full of Solana traders complaining about DeFi transaction parsing. Koinly charges $279/yr for 10K+ transactions. Netrunner.tax is Solana-specific but requires manual wallet connection and doesn't offer conversational analysis or tax-loss harvesting suggestions.

**Tools needed without Raze:** Koinly ($279/yr) OR CoinLedger ($199/yr) OR Netrunner.tax + manual review + accountant ($500+)

---

# Section 2H: Onboarding (Use Case 17)

---

## 17. Crypto Newbie Onboarder: Your Friend's First SOL Purchase

**Scenario:** A crypto-curious friend asks how to buy their first SOL and do something with it. They don't know what a DEX, wallet, or seed phrase is. The Reddit thread 'Best wallet for Solana newbies' (r/solana, 2025) is full of confused beginners.

> **User:** "my friend just got into crypto. they have $100 on coinbase. how do they get started on solana?"

> **Raze:** "welcome your friend to the trenches. here's the dead simple path:
>
> step 1: download Phantom wallet (phantom.app) - it's like a crypto bank account
> step 2: WRITE DOWN the 12 words it gives you. on PAPER. not a screenshot. these are your master password forever.
> step 3: on Coinbase, buy SOL if they haven't. send SOL to their Phantom address (I'll walk them through it)
> step 4: once SOL arrives, they can talk to me. 'swap 10 USDC to SOL' - I handle the rest.
>
> tell them to DM @razeaii_bot. I'll be nicer to them than I am to you. for the first week.
>
> also tell them: never click links in DMs. ever. people WILL try to steal their money. the paranoia is justified."

**Why this is painful without Raze:** Current onboarding requires understanding wallets, seed phrases, exchanges, bridges, DEXs, slippage, and gas fees. DexTools' 'How to Buy Memecoins on Solana' guide (2026) is a 12-step tutorial that assumes existing DeFi knowledge. Natural language removes the UX cliff entirely.

**Tools needed without Raze:** Coinbase + Phantom setup guide + YouTube tutorials + DEX tutorial + inevitable mistakes + more YouTube

---

# Section 2I: Emergency Scenarios (Use Cases 18–19)

When seconds matter — the use cases where Raze isn't just convenient, it's essential.

---

## 18. Wallet Compromise Response: Emergency Asset Evacuation

**Scenario:** Trader suspects their wallet is compromised - they see an unauthorized transaction. Every second counts. They need to move remaining assets to a safe wallet immediately.

> **User:** "HELP - I see a transaction I didn't make. someone is draining my wallet"

> **Raze:** "EMERGENCY MODE ACTIVATED.
>
> scanning wallet now... unauthorized transfer detected 2 min ago: 12 SOL sent to unknown address.
>
> remaining assets: 34 SOL, $2,100 in tokens, 3 NFTs
>
> IMMEDIATE ACTIONS:
> 1. I can sweep ALL remaining assets to a new wallet RIGHT NOW
> 2. generating new Raze wallet... done: 8xMn...4pQr
> 3. sending: 34 SOL... SENT. $2,100 tokens (6 txns)... SENT. 3 NFTs... SENT.
>
> all assets evacuated in 18 seconds.
>
> NEXT STEPS:
> - REVOKE all token approvals on old wallet (I just did this)
> - never use old wallet again
> - check if you signed any suspicious transactions recently
> - the attacker got 12 SOL ($1,800). everything else is safe.
>
> what matters: you still have $7,200. breathe."

**Why this is painful without Raze:** The Solana Wallet Drainer Recovery guide (2025) documents a manual 8-step process that takes 15-30 minutes. Most victims lose everything because they don't know what to do and panic-Google while assets drain. No tool offers one-message emergency evacuation with automatic new wallet creation.

**Tools needed without Raze:** Panic + Google 'wallet compromised' + manual Phantom transfers one by one + Revoke.cash + prayer

---

## 19. Exploit/Hack Alert: Protocol-Level Threat Detection

**Scenario:** A DeFi protocol where the user has funds gets exploited. They need to know immediately and withdraw before the exploit spreads to their pool.

> **User:** "monitor all protocols where I have funds for exploit alerts"

> **Raze:** "monitoring 4 protocols where you have deposits:
> - marginfi: $2,100 lending
> - Orca: $1,400 LP
> - Jito: $4,200 staking
> - Drift: $800 perps margin
>
> [3 days later]
>
> THREAT ALERT: unusual activity detected on marginfi
> - large abnormal withdrawal from lending pool ($4.2M in 90 seconds)
> - oracle price discrepancy detected on SOL/USDC pool
> - twitter chatter: possible oracle manipulation exploit
>
> your exposure: $2,100 in SOL lending pool
>
> recommendation: withdraw immediately. I've already prepared the withdrawal transaction.
>
> confirm to withdraw? every minute matters."

**Why this is painful without Raze:** Most DeFi users learn about exploits from Twitter 15-30 minutes after they happen. By then, withdrawal queues are saturated and funds may be locked. No consumer tool monitors protocol health in real-time and correlates it with your specific positions.

**Tools needed without Raze:** Twitter monitoring + manual protocol checking + slow reaction time + significant losses

---

# Section 2J: Cross-Referencing Power Plays (Use Cases 20–21)

Where Raze's multi-source intelligence creates alpha that no single tool can replicate.

---

## 20. Copy-Trade Intelligence: Don't Just Copy, Understand Why

**Scenario:** A user wants to copy a whale's trades but also understand the context - why is this whale buying? What do they know? Raze combines wallet tracking with token research automatically.

> **User:** "toly.sol just bought something new. what is it and should I follow?"

> **Raze:** "toly.sol just bought 1,000 SOL ($150K) of $PYTH
>
> context layer:
> - $PYTH is the Pyth Network oracle token
> - Pyth governance vote happening in 3 days (staking for voting power?)
> - toly has history with Pyth (early advisor)
> - other insider wallets: 2 more Solana ecosystem wallets bought $PYTH today
> - sentiment: 64/100 neutral, no CT hype yet
> - price: still flat, market hasn't noticed
>
> assessment: this looks like governance positioning, not a trade. insiders accumulate before governance events. could see 15-30% pump if market catches on.
>
> want to follow with a smaller position? the smart play is size it at 1/10th of your comfort zone."

**Why this is painful without Raze:** Copy trading tools like SpyBot and Cielo show WHAT a wallet bought but never WHY. Understanding the context requires separate research into governance events, advisor relationships, and correlated wallet movement. Solana copy trading guides (solanatools.io, 2026) describe copy trading as 'following without understanding.'

**Tools needed without Raze:** Cielo/SpyBot (wallet tracking) + Governance calendar + CT research + Solscan + manual correlation

---

## 21. Token Narrative Analysis: What Story Is the Market Telling?

**Scenario:** Before buying a narrative play (AI tokens, RWA, DePIN), a trader wants to know: is this narrative growing or dying? Which tokens in the narrative are strongest? What's the smart money doing sector-wide?

> **User:** "give me a full breakdown of the AI narrative on Solana right now"

> **Raze:** "SOLANA AI NARRATIVE REPORT:
>
> sector health: GROWING (up 34% in 7d aggregate mcap)
>
> top tokens by momentum:
> 1. $RENDER - $2.1B mcap, +18% 7d, smart money: accumulating
> 2. $RNDR - bridged activity up 40%
> 3. $NOSANA - $89M mcap, +67% 7d, whale accumulation detected
> 4. $SYNTH - $12M mcap, new, clean security, viral CT mention
>
> sentiment: 78/100 bullish (highest in 30d)
> smart money flow: +$14M net inflow to AI tokens (7d)
> key catalyst: NVIDIA earnings next week (historically pumps AI tokens)
>
> my take: $NOSANA looks like the asymmetric play. small cap + whale accumulation + clean security + sector tailwind. $RENDER is the safer bet.
>
> narrative trades are about timing. this one has legs for at least 2 more weeks based on the catalyst calendar."

**Why this is painful without Raze:** No tool offers sector-level narrative analysis combining market cap aggregation, smart money flow, sentiment, catalyst calendars, and individual token security. Traders manually browse DexScreener categories, check CT, and guess at narrative momentum.

**Tools needed without Raze:** DexScreener categories + LunarCrush + CT scrolling + manual catalyst tracking + whale watchers

---

# Section 2K: Advanced Features (Use Cases 22–25)

DCA automation, governance, multi-wallet management, and MEV protection.

---

## 22. DCA Strategy via Chat: Dollar-Cost Average Without a Platform

**Scenario:** A trader wants to DCA into SOL or a specific token over time. No Solana bot offers automated DCA. They'd need to manually buy at intervals or use Jupiter's limited DCA feature with a web UI.

> **User:** "DCA $50 into JUP every Monday for the next 8 weeks"

> **Raze:** "DCA plan created:
>
> token: $JUP
> amount: $50/week (50 USDC per buy)
> schedule: every Monday at 10:00 UTC
> duration: 8 weeks
> total investment: $400
>
> week 1 (today): bought 54.3 JUP at $0.921
>
> you'll get a notification each Monday with the execution + running average price.
>
> historically, DCA into JUP over 8 weeks would've beaten lump-sum 63% of the time in the last 6 months. patience > gambling."

**Why this is painful without Raze:** Jupiter has a DCA feature but it requires the web UI, pre-depositing all funds upfront, and limited token support. BonkBot and Trojan have zero DCA capability. Most traders just forget to buy regularly.

**Tools needed without Raze:** Jupiter DCA (web only, lump deposit required) OR manual weekly buys via Telegram bots + calendar reminders

---

## 23. DAO Vote Digest: Governance Without the Browser

**Scenario:** A DAO token holder needs to vote on proposals but governance UIs are clunky. They often miss voting deadlines because checking Realms requires intentional browser visits.

> **User:** "any governance votes I need to know about for tokens I hold?"

> **Raze:** "active governance scan for your holdings:
>
> $JUP - Jupiter DAO:
>   VOTE NOW: Proposal #47 - Reduce swap fees from 0.3% to 0.2%
>   ends in: 18 hours
>   current: 67% FOR, 33% AGAINST
>   your voting power: 1,240 JUP
>   impact: lower fees = more volume = potentially bullish for $JUP
>
> $MNDE - Marinade:
>   VOTE NOW: Proposal #12 - Expand validator set from 400 to 500
>   ends in: 3 days
>   current: 81% FOR
>   your voting power: 340 MNDE
>
> you've missed 4 votes in the last month. that's airdrop points you're leaving on the table btw.
>
> want me to vote FOR on both? takes 2 seconds."

**Why this is painful without Raze:** Realms (Solana's governance platform) requires visiting a browser, connecting wallet, finding your DAOs, reading proposals, and voting individually. The Realms review (MadeOnSol, 2026) notes low voter participation due to UX friction. Most token holders never vote despite holding governance tokens.

**Tools needed without Raze:** Realms website + wallet connection + manual proposal review + remembering to vote before deadline

---

## 24. Multi-Wallet Unified Dashboard: See Everything in One Place

**Scenario:** A serious trader has 3-5 wallets for different strategies (main, degen, airdrop farming, cold storage). No tool gives a unified view across all wallets with strategy context.

> **User:** "show me my full portfolio across all wallets"

> **Raze:** "UNIFIED PORTFOLIO (4 wallets):
>
> total value: $18,420
>
> wallet 1 (main - hot): $8,200
> - 34 SOL, $2,100 in DeFi positions, $1,900 in blue chips
>
> wallet 2 (degen): $1,400
> - 8 memecoins, avg age 3 days, PnL: -12% (ouch)
>
> wallet 3 (farm): $4,620
> - staking: 28 jitoSOL, marginfi deposits, airdrop interactions
>
> wallet 4 (cold): $4,200
> - 28 SOL long-term hold, untouched 6 months
>
> cross-wallet insights:
> - total SOL exposure: 72% (heavily correlated to SOL price)
> - if SOL drops 20%, your portfolio drops ~$2,650
> - your degen wallet is underperforming. consider mercy-killing those positions.
>
> want a detailed breakdown of any wallet?"

**Why this is painful without Raze:** Phantom only shows one wallet at a time. Step Finance and Sonar Watch offer multi-wallet but with no strategy labeling, no cross-wallet risk analysis, and no personality. Traders with multiple wallets have zero unified intelligence layer.

**Tools needed without Raze:** Phantom (one wallet at a time) + Step Finance (basic multi-wallet) + manual spreadsheet for strategy tracking

---

## 25. MEV Protection Check: Am I Being Frontrun?

**Scenario:** A trader suspects they're getting sandwiched on their swaps - paying more than they should. They want to know if their recent trades were MEV-attacked and how to avoid it.

> **User:** "check my last 10 swaps - was I getting frontrun?"

> **Raze:** "MEV analysis of your last 10 Jupiter swaps:
>
> sandwiched: 3/10 trades (30%)
>
> trade #4: $WIF buy - sandwiched for $12.40 extra slippage
> trade #7: $BONK buy - sandwiched for $8.90
> trade #9: $JUP buy - sandwiched for $3.20
>
> total MEV tax paid: $24.50 across 10 trades
>
> why it's happening: you're using default slippage (1%) and not using Jito bundles.
>
> fixes:
> 1. I'll route your future swaps through Jito bundles (MEV protection)
> 2. reduce slippage to 0.5% for established tokens
> 3. for memecoins, use priority fees instead of high slippage
>
> want me to enable MEV protection for all future swaps? the sandwichers have been eating your lunch."

**Why this is painful without Raze:** Most traders have no idea they're being sandwiched. Jito's MEV dashboard exists but is developer-focused. No consumer tool retroactively analyzes your swap history for MEV extraction and suggests remediation. The wallet rotation guide (The Terminal Room, 2026) describes MEV as a hidden tax most traders don't know they're paying.

**Tools needed without Raze:** Jito Explorer (developer tool) + manual transaction analysis on Solscan + deep Solana knowledge

---

# Section 3: Real Social Media Evidence

The following are real posts, threads, and discussions from Reddit, Twitter, and community forums that describe exact workflows Raze would solve.

---

## 3.1 Reddit: r/SolCoins - Multi-Tool Workflow Frustration

**Thread:** "Finally streamlined my Solana trading workflow after months of frustration" (r/SolCoins, 2025)

A trader describes their 7-step process involving DexScreener, RugCheck, Birdeye, BubbleMaps, LunarCrush, Photon, and a spreadsheet just to evaluate and trade a single token. Top comments echo the pain: "This is why I miss trades - by the time I finish research, the pump is over." Raze collapses this entire workflow into one message.

---

## 3.2 Reddit: r/solana - Telegram Bot Trust Issues

**Thread:** "What's stopping these Telegram trading bots from stealing your funds?" (r/solana, 2025)

180+ comments debating the custodial risk of BonkBot and Trojan. Users note that these bots hold your private keys. Top comment: "I only put money I'm willing to lose in these bots." Raze's WalletConnect integration (self-custody signing via Phantom/Backpack) directly addresses this - users never give up their keys.

---

## 3.3 Reddit: r/defi - Airdrop Checker Fragmentation

**Thread:** "Solana Airdrop Checkers in 2026?" (r/defi, 2025)

Users list 6+ airdrop checking tools (Drops.bot, SolanaGuides, Earni.fi, etc.) and complain that none give a unified view. "I have 3 wallets and 10 protocols to check. That's 30 manual connections." Raze's multi-wallet airdrop scan (Use Case #13) solves exactly this.

---

## 3.4 Reddit: r/CryptoTax - Solana DeFi Tax Nightmare

**Thread:** "Which crypto tax software do you actually use?" (r/CryptoTax, 2025)

Solana-specific complaints dominate: "Koinly can't parse Jupiter DCA transactions," "My 400 swap history broke CoinTracker," "I've spent more on tax software than I made trading." The conversational tax estimate (Use Case #16) addresses the 80% of traders who just need a rough number before deciding to pay for full software.

---

## 3.5 GitHub: Solana Bot Execution Friction

**Issue:** "Quick question: your #1 friction in Solana bot execution?" (GitHub issue #80, WSOL12/Solana-Arbitrage-Bot)

Developer and trader responses cite: failed transaction simulation, priority fee confusion, MEV sandwich attacks, and multi-step approval flows. Raze abstracts all of this behind natural language.

---

## 3.6 Crypto Twitter: The 6-Tab DYOR Problem

Multiple viral threads document the '6-tab DYOR' workflow: DexScreener for chart, RugCheck for security, Birdeye for holders, BubbleMaps for cluster analysis, LunarCrush for sentiment, Solscan for on-chain. The DEXTools '2-Minute Memecoin Checklist' (2026) formalizes this exact multi-tool workflow that Raze replaces with a single message.

---

# Section 4: Cross-Ecosystem Competitive Intelligence

Products in other ecosystems that Raze can learn from, and unserved niches in Solana tooling.

---

## 4.1 Emerging Solana AI Agents

### SolClaw (solclaw.ai)

Open-source AI agent for Solana on WhatsApp and Telegram. Supports swaps, staking, token deployment via natural language. Built by Anagram. **LIMITATION:** No security scanning, no sentiment analysis, no whale tracking, no personality. Pure execution, no research. Raze's moat is the research + opinion layer on top of execution.

### Tragent (tragent.network)

'AI Copilot for Solana.' Browser-based, not Telegram-native. Focuses on portfolio analysis and trade suggestions. **LIMITATION:** Not conversational in chat apps where traders already live. No group chat functionality. No personality/entertainment value.

### Let's Boogie (letsboogie.xyz)

AI crypto trading assistant on Telegram. Focuses on fast execution. **LIMITATION:** Speed-focused swap bot with AI branding but minimal actual intelligence. No cross-referencing of security + sentiment + whale data.

### Trader.dev

'Next-gen AI Trading on Telegram.' Targets sophisticated traders with natural language. **LIMITATION:** Early stage, limited feature set. No evidence of security scanning or sentiment integration.

---

## 4.2 Ethereum/Base Ecosystem Agents

### Base AI Agents Ecosystem (base.org/agents)

Coinbase's Base chain has an official AI agents page with frameworks for building trading agents. The ecosystem is developer-focused (CDPC, AgentKit) rather than consumer-facing. No equivalent to Raze's consumer-ready Telegram experience. Raze can learn from Base's developer tooling approach for its BYOMCP feature.

### xTheo (agenttheo.com)

'AI-Native DeFi Trading Platform.' Multi-chain including Solana. Browser-based, not Telegram. Focuses on autonomous trading strategies. **LESSON FOR RAZE:** xTheo's strategy builder (define rules in English, agent executes) is a feature Raze could add - 'if SOL drops 10%, buy 5 SOL' style conditional orders.

### Fere AI ($1.3M raised)

Self-improving trading agent. Multi-chain. **LESSON FOR RAZE:** Fere's self-improvement loop (learning from past trade outcomes) is a compelling feature. Raze could track its own recommendation accuracy over time.

### EchoAgent by Echobit

Bridges natural language to trade execution on CEXs. **LESSON FOR RAZE:** CEX integration could expand Raze's reach - 'move 50% of my Binance SOL to my Phantom wallet' style cross-venue commands.

---

## 4.3 Unserved Niches in Solana Tooling

### 1. Conversational Risk Management

No tool offers natural-language risk management: trailing stops, exposure limits, correlation warnings, auto-rebalancing. Every 'portfolio manager' is a passive dashboard, not an active agent. This is Raze's biggest whitespace opportunity.

### 2. Group Intelligence Layer

Trading groups on Telegram have zero shared tooling. No aggregate portfolio view, no shared research, no group leaderboards. Raze in group chats creates an entirely new category: collaborative trading intelligence.

### 3. Cross-Protocol Yield Intelligence

No tool compares yields across Jito, Marinade, marginfi, Kamino, Orca, and Raydium in real-time with risk context. DeFiLlama shows rates but with no actionability. The Solana liquid staking fragmentation problem (ainvest, 2026) is a documented pain point with no consumer solution.

### 4. Emergency Response Tooling

Wallet compromise response is entirely manual. No tool offers one-message emergency evacuation. The 'golden hour' after a compromise determines whether you lose everything or save most assets. This is a life-saving feature, not just a nice-to-have.

### 5. Governance Participation Layer

Solana DAO participation rates are extremely low despite millions in governance token holdings. Realms UX is too friction-heavy. A conversational voting interface could 10x participation. No one is building this.

### 6. MEV Awareness for Retail

Retail traders on Solana lose millions to sandwich attacks without knowing it. No consumer tool retroactively analyzes MEV extraction from your trades. Jito's tools are developer-focused. The retail MEV awareness gap is a massive unserved niche.

---

# Section 5: Strategic Implications

Based on this research, Raze's competitive position is defined by three moats that no competitor currently combines:

---

## Moat 1: Research + Execution in One Interface

Every competitor is either research-only (DexScreener, Birdeye, LunarCrush) or execution-only (BonkBot, Trojan). Raze is the first tool that does both in a single conversational flow. The '6-tab DYOR' problem is the #1 pain point in Solana trading, and Raze is the only product that solves it.

## Moat 2: Cross-Data Intelligence

No tool cross-references security data + sentiment data + whale activity + governance events + portfolio context. Each data source alone is commodity. The intelligence emerges from combining them. This is Raze's deepest moat because it requires integrating 5+ data providers and building an AI layer that synthesizes them meaningfully.

## Moat 3: Personality as Product

BonkBot has 519K users with zero personality. Trojan has 2M users with zero personality. In a market of identical swap bots, Raze's sarcastic, opinionated persona creates genuine user affinity and retention. Users don't just use Raze - they enjoy using Raze. In group chats, the personality becomes entertainment, making Raze sticky in a way pure utility tools never are.

---

## Recommended Priority Roadmap

Based on unserved niche analysis and behavioral evidence:

**1. SHIP NOW:** Group chat mode (Use Cases 10-11) — viral growth mechanic, no competitor has this, creates network effects within trading communities.

**2. SHIP NEXT:** Risk management suite (Use Cases 5, 7, 8) — trailing stops, rebalancing, exposure analysis. Completely unserved market. Revenue opportunity via premium tier.

**3. BUILD MOAT:** Cross-data intelligence (Use Cases 3, 4, 20, 21) — convergence alerts, sentiment divergence, narrative analysis. This is the 'magic' that makes users say 'how did Raze know that?'

**4. SAVE LIVES:** Emergency features (Use Cases 18-19) — wallet evacuation and exploit alerts. Low frequency but extreme loyalty driver. Users who get saved by Raze become evangelists.

---

*This report was compiled using evidence from Reddit (r/solana, r/SolCoins, r/defi, r/CryptoTax), GitHub issues, published guides from DEXTools, DaybreakScan, Solana Compass, MadeOnSol, and product analysis of 15+ competing tools across Solana, Ethereum, and Base ecosystems.*
