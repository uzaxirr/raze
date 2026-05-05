# Raze on Solana: Real Trader Workflows for an AI Agentic Telegram Bot

## Executive Summary

Solana traders today stitch together Telegram bots, web dashboards, block explorers, airdrop checkers, portfolio trackers, and tax tools to manage their lifecycle from pre‑trade research to post‑trade monitoring, risk management, airdrops, DeFi, NFTs, and taxes. Existing Telegram bots like BONKbot, Trojan, GMGN, Shuriken, and Drops Bot excel at fast execution, sniping, basic wallet/PnL tracking, and price alerts, but they are command‑driven tools with limited reasoning, no true cross‑tool research, and minimal personality. Raze can differentiate as an AI agent that *thinks* and *narrates*, combining security scanning, research, wallet analytics, whale tracking, and execution inside Telegram.[^1][^2][^3][^4][^5][^6][^7][^8][^9]

This report distills 20+ concrete, evidence‑backed use cases that map to behaviors seen in real Solana trader communities (Reddit, Twitter, dev blogs, GitHub, and product docs). It also highlights analogous products on Ethereum/Base and unserved gaps in the Solana tooling stack.

***

## 1. Pre‑Trade Research Workflows

### 1.1 One‑shot token due diligence before buying

**Behavioral evidence**  
Solana traders routinely hop between on‑chain scanners, PnL tools, and DEX aggregators to vet new tokens: checking mint and freeze authority, LP lock/burn, holder concentration, deployer history, bundlers, and early buyers. Guides on honeypot detection emphasize freeze authority, blacklist functions, and simulated sells as pre‑trade checks, and warn that most losses come from token‑side scams, not bad timing.[^9][^10][^11][^12]

**Raze workflow**  
- **User scenario**: DeFi degen in a Pump.fun alpha group, sees a contract drop in chat and wants a 30‑second go/no‑go answer.  
- **User message**: `"yo raze, give me the full rundown on this mint: 9x...Xw. is this safe or cooked?"`  
- **Raze response** (conceptual): Summarized risk score with: mint/freeze/authority status, LP size and whether burned/locked, holder distribution and top dev wallets, bundler/insider detection, deployer track record, simulated buy/sell step, plus a brutal verdict: "can flip this but don’t marry it."  
- **Pain with current tools**: Trader must open RugCheck / GMGN for security, Birdeye for volume/liquidity, Solscan for deployer history, and Jupiter for route/liquidity depth; doing this fast for every token is error‑prone and mentally taxing.[^10][^11][^9]
- **Tools they juggle today**: RugCheck / Soul Scanner / token‑scanner bots, Birdeye, GMGN, Solscan/Explorer, Jupiter terminal.

### 1.2 Cross‑referencing security + momentum + sentiment

**Behavioral evidence**  
On‑chain traders increasingly combine smart‑money flows, security checks, and social sentiment to filter noise. Articles on Solana trading stress that profitable wallets, liquidity changes, and deployer behavior together provide better signals than charts alone.[^13][^14][^9]

**Raze workflow**  
- **Scenario**: Swing trader deciding whether to rotate from one meme into another.  
- **User message**: `"compare $DOGGO and $CAT on sol across safety, volume, whales and CT sentiment. which one do we ape and why?"`  
- **Raze response**: Table summarizing:
  - Security (honeypot / mint / LP / holders),
  - Liquidity and 24h volume,
  - Smart‑wallet net flow (whale buys vs exits),
  - LunarCrush‑style sentiment and social buzz.
  Plus a sarcastic conclusion: "cat has cleaner contract and actual whales buying. doggo is pure cope."  
- **Pain today**: Manual triangulation between Birdeye (volume/liquidity), security scanners, wallet‑tracking dashboards, and LunarCrush or Twitter search; no single assistant ranks them with reasoning.
- **Tools juggled**: Birdeye, GMGN or Dexscreener, RugCheck/Soul Scanner, Nansen‑style wallet trackers, LunarCrush or social feeds.[^15][^3][^13][^9]

### 1.3 Researching wallets behind a token before entry

**Behavioral evidence**  
Traders build tools that cluster wallets, identify high‑PnL traders, and track deployers and insiders to spot trends and rugs. Reddit threads describe monitoring Pump.fun and Raydium while analyzing holder growth, real vs bot volume, and wallet patterns instead of copy‑trading blindly.[^16][^17][^13][^9]

**Raze workflow**  
- **Scenario**: User considering a memecoin that already ran 3–5x wants to know if "smart money" is exiting.  
- **User message**: `"before i touch $ZOOMER, show me: deployer history, top 20 wallets, and if the big brains are dumping or still adding."`  
- **Raze response**: Clusters top wallets, tags deployer and related addresses, shows net‑inflow/outflow, average entry price, and a summary like "deployer already pulled 40% of their stack, anon. you’re exit liquidity if you buy here."  
- **Pain today**: Requires a wallet‑analytics SaaS or Dune/Nansen‑style dashboards plus custom explorer work; not accessible from inside Telegram where alpha is consumed.[^5][^17][^13]
- **Tools juggled**: Wallet Master, Dune dashboards, Birdeye / DexWhales, Solscan, custom bots.[^18][^13][^5]

### 1.4 "Explain this token like I’m new" onboarding research

**Behavioral evidence**  
Crypto‑newbie guides from wallets and CEXs explain basics like what Solana dapps are, how NFTs/DEXs work, and the difference between staking vs yield farming. Many Reddit threads ask "how do you research a project" or "what tools are good for trading in Solana" and get multi‑tool answers (Jupiter for swaps, Drift for perps, MarginFi for borrowing, Jito for liquid staking, Step for dashboards).[^19][^20][^21][^1]

**Raze workflow**  
- **Scenario**: Existing CEX user bridging to Solana, confused by DEXes and wallets.  
- **User message**: `"razor, explain $JUP to my boomer friend. what does it do, why do people care, and how wrecked can he get?"`  
- **Raze response**: Plain‑English project summary, token utility, major risks (FDV vs circulating, unlocks if any, competition), and a roast: "tell him this isn’t his bank’s FD. it’s volatile internet points."  
- **Pain today**: Users bounce between docs, Twitter threads, and random YouTube explainers; few tools contextualize it inside a chat where they already are.[^20][^1][^19]
- **Tools juggled**: Project docs, Coingecko, CEX articles, YouTube, Reddit.

### 1.5 Multi‑token watchlist triage inside Telegram

**Behavioral evidence**  
Traders ask for "best tools for trading" or "how to keep track of wallet/coin PnL", and answers list portfolio trackers like Zerion, CoinStats, dedicated PnL tools, and CSV exports. Telegram bots like Drops Bot already combine alerts with simple limit orders and TP/SL. But there is no AI that triages a watchlist and suggests focus tokens.[^4][^22][^8][^1][^5]

**Raze workflow**  
- **Scenario**: User tracks 20 Solana tokens across wallets and is overwhelmed.  
- **User message**: `"here’s my watchlist: [paste]. tell me top 3 i should focus on today based on volume spikes, news, and whale flow."`  
- **Raze response**: Ranks tokens by unusual volume, social buzz, and whale net‑buy, and explains: "focus $A, $B, $C — they’re actually moving. the rest are your emotional support bags."  
- **Pain today**: Requires cross‑checking portfolio tracker, Birdeye/Dexscreener charts, LunarCrush, and wallet trackers; most users do this manually or not at all.[^4][^5][^9]
- **Tools juggled**: Zerion, Birdeye, LunarCrush, wallet trackers, Telegram price bots.

***

## 2. Post‑Trade Monitoring and PnL

### 2.1 Roast‑style wallet performance reviews

**Behavioral evidence**  
There are numerous guides and bots focused on Solana wallet tracking and PnL: open‑source Telegram wallet trackers, SaaS PnL dashboards, and how‑to posts for calculating PnL per wallet. Reddit users explicitly ask "How do you keep track of your wallet/coins PnL?" and are pointed to apps like Zerion that show history, PnL, and CSV export.[^23][^24][^22][^17][^18][^5][^4]

**Raze workflow**  
- **Scenario**: User connects wallet and wants a brutally honest performance review.  
- **User message**: `"scan my wallet and rate me from 1-10 trader. don’t lie."`  
- **Raze response**: Aggregates realized/unrealized PnL, win rate, best/worst trades, average holding time, and token‑level stats, then responds: "you are a solid 3/10 degen. you buy tops, sell bottoms, and your only green trade is SOL you forgot about."  
- **Pain today**: Existing tools show metrics but do not narrate or coach; users must interpret dashboards themselves.[^18][^5][^4]
- **Tools juggled**: Zerion, Wallet Master, Birdeye, CSV exports to Excel, custom bots.[^24][^4][^18]

### 2.2 PnL and risk by narrative or sector

**Behavioral evidence**  
DeFi and meme traders talk about allocating across narratives, comparing protocols (e.g., Raydium vs Serum vs Tulip vs Jito), and tracking PnL across categories. Portfolio trackers typically let users filter by token or wallet, not by narrative.[^25][^26][^27][^20]

**Raze workflow**  
- **Scenario**: User wants to know if their "DeFi blue chips" vs "memes" are actually working.  
- **User message**: `"split my bags into memes, defi, nfts, and restaking. what’s my pnl and risk in each bucket?"`  
- **Raze response**: Auto‑categorizes tokens (Jito/Jupiter/Tulip/Drift vs BONK/WIF vs NFTs), summarizes bucket‑level PnL and volatility, suggests tilt: "memes: +240% with tiny size; DeFi: +12% with big size. you’re pretending to be safe but secretly degen."  
- **Pain today**: Requires manual tagging in Koinly/portfolio tools or spreadsheets; no Telegram‑native agent does this classification for Solana specifically.[^28][^5][^4]
- **Tools juggled**: Koinly/crypto tax tools, portfolio apps, spreadsheets.

### 2.3 Adaptive take‑profit suggestions after a big move

**Behavioral evidence**  
Threads like "Made 1.5M in memecoins" emphasize dynamic risk management: scaling out, not round‑tripping profits, and adjusting exposure once a coin runs. Telegram bots like Drops Bot and Shuriken already allow TP/SL limit orders inside chat, indicating demand for automated exit logic.[^7][^8][^21][^9]

**Raze workflow**  
- **Scenario**: A token 10x’d overnight; user is emotionally attached.  
- **User message**: `"razor, $DOGMOON is up 12x. how do i take profit without full paper‑handing?"`  
- **Raze response**: Reads entry price, position size, and current price, then proposes staged exits, e.g. "sell 30% now, set a TP limit for another 30% at 15x, trail the rest" and offers one‑tap Jupiter swap plus alerts: "i’ll ping you if this nukes 30% from here."  
- **Pain today**: Users either manually place multiple orders or rely on single TP/SL in bots; no one explains the strategy in natural language based on that wallet’s actual behavior.[^29][^8][^7]
- **Tools juggled**: Shuriken / Drops Bot / Trojan, DEX UI, portfolio tracker.

***

## 3. Risk Management and Portfolio Control

### 3.1 Virtual stop‑loss layer on top of spot DEXs

**Behavioral evidence**  
Multiple Reddit threads complain that Solana spot DEXes like Jupiter do not support stop‑loss in the way users expect; they only provide limit orders. Guides explain why spot stop‑loss is tricky on DEXs and suggest workarounds or perp platforms.[^30][^31][^32]

**Raze workflow**  
- **Scenario**: User holds spot SOL and memecoins via self‑custody, wants simple downside protection.  
- **User message**: `"set a soft stop loss on my $WIF bag 30% below current price and auto‑sell to USDC if it nukes."`  
- **Raze response**: Watches price off‑chain via Birdeye/Helius, and when trigger hits, proposes a Jupiter swap transaction via WalletConnect with blunt commentary: "stop triggered, i’m bailing you out before you round‑trip this entire pump."  
- **Pain today**: Users must either move assets to CEXes with stop‑loss, use perps, or rely on specialized bots that require manual configuration and commands; there is no conversational layer that explains and maintains their rules.[^31][^30][^7]
- **Tools juggled**: CEX (Binance/Backpack Exchange), Jupiter UI, Shuriken/Drops, manual alerts.

### 3.2 Portfolio‑level risk rules and rebalancing

**Behavioral evidence**  
Risk rules like "max 5% per degen trade," "max 3 concurrent positions," daily loss limits, and emergency exits are codified in trading frameworks and bots. Off‑chain tools and CEX bots provide smart portfolio rebalancing (e.g., KuCoin Smart Rebalance, portfolio rebalancing bots, Base‑native AgentV).[^33][^34][^35][^36][^37][^38][^9]

**Raze workflow**  
- **Scenario**: User acts like a degen but wants guardrails.  
- **User message**: `"from now on, never let any single shitcoin be more than 5% of my stack and cap open positions at 5. yell at me if I try to YOLO."`  
- **Raze response**: Reads wallet, monitors positions and new buys, and when the user tries to over‑allocate, Raze replies: "that order would make $RUGCOIN 14% of your net worth. touch grass, size down or confirm you want to ignore your own rules."  
- **Pain today**: Some CEX or off‑chain bots support rebalancing, but Solana DEX trading plus self‑custody lacks AI‑driven rule enforcement inside Telegram.[^35][^36][^38]
- **Tools juggled**: Rebalancing bots (3Commas etc.), CEX accounts, spreadsheets.

### 3.3 Emergency kill‑switch when portfolio drawdown hits

**Behavioral evidence**  
Risk rule templates recommend portfolio‑level emergency stops (e.g., exit all positions if portfolio down 25%). Traders often ignore such rules in the moment due to emotion.[^34][^33]

**Raze workflow**  
- **Scenario**: User wants automated discipline.  
- **User message**: `"if my whole wallet drops more than 25% from this balance, dump all degen tokens to USDC and ping me."`  
- **Raze response**: Tracks wallet value via Helius, and when threshold hits, proposes batched Jupiter swaps or a prioritized liquidation order, plus a harsh line: "you just hit -25%. i’m pulling the cord; you can thank me later."  
- **Pain today**: Implemented only via custom bots or manual monitoring; not accessible to non‑coding traders and not integrated with wallet analytics.[^33][^34]
- **Tools juggled**: Custom bots, portfolio dashboards, individual bots for each token.

***

## 4. Social and Group‑Chat Dynamics

### 4.1 Live fact‑checker in meme coin alpha groups

**Behavioral evidence**  
Solana memecoin trading revolves around Telegram alpha groups and callers; users rely on group curators while worrying about rugs and bad calls. Many trading bots integrate "Buy" buttons into Telegram alerts so traders can act instantly, showing that execution inside group chats is standard.[^39][^40][^8][^11][^9]

**Raze workflow**  
- **Scenario**: Group chat with a few hundred members posting Pump.fun contracts and hype blurbs.  
- **User message** (replying to a post): `"@razeaii_bot scan this token and roast the caller if it’s trash."`  
- **Raze response**: In‑thread summary of token safety, early buyers, deployer history, and sentiment, with group‑appropriate banter: "contract looks like a phishing tutorial, not a project. caller wants your SOL, not your success."  
- **Pain today**: Individual users copy contracts into separate bots/apps; there’s no shared, objective, sarcastic analyst living in the group context.
- **Tools juggled**: Token scanners, Birdeye, separate Telegram bots, explorers.[^41][^42][^43]

### 4.2 Group PnL scoreboard and bragging rights

**Behavioral evidence**  
Communities love sharing PnL screenshots and comparing performance; products like Wallet Master and Zerion emphasize multi‑wallet comparison views. Reddit posts like "My trading experience" or "Made X in meme coins" are essentially narrative PnL flexes.[^44][^21][^5][^4][^18]

**Raze workflow**  
- **Scenario**: Friends’ Telegram group wants recurring "leaderboard" updates.  
- **User message**: `"every sunday, post a leaderboard for these wallets and roast whoever is coping the hardest."`  
- **Raze response**: Aggregates each wallet’s weekly PnL, win rate, and risk metrics, then posts a formatted table plus commentary: "winner: @alice +42%. biggest clown: @bob, -68% from buying every tg call late."  
- **Pain today**: Requires manual exports to dashboards or custom scripting; no consumer bot does AI‑style commentary plus cross‑wallet analytics directly in a group.[^23][^24][^18]
- **Tools juggled**: Wallet PnL tools, spreadsheets, manual screenshot sharing.

### 4.3 Co‑pilot for Telegram call channels and whales

**Behavioral evidence**  
Bots like Drops Bot and others already let users trade directly from wallet alerts or caller links, demonstrating demand for "act on alerts in chat" flows. There are Telegram bots for tracking whale wallets and copying trades, but they are largely rule‑based.[^45][^46][^8]

**Raze workflow**  
- **Scenario**: User follows multiple call channels and whale alerts but cannot triage them.  
- **User message**: `"for the next 24h, watch @BatmanGems, @BullishBangers and wallet ABC…. summarize only high‑conviction plays that pass security checks and have real volume. DM me those."`  
- **Raze response**: Monitors those channels and wallets, filters out low‑liquidity or unsafe tokens, and pings the user with distilled entries: "caller X posted $TOKENY, LP is locked, volume real, two profitable whales just entered; want a 1 SOL probe?"  
- **Pain today**: Users manually skim channels, check tokens across scanners, and still miss good calls or chase late entries.[^40][^9]
- **Tools juggled**: Signal groups, scanner bots, wallet trackers, manual Jupiter/Birdeye checks.

***

## 5. Airdrop Hunting and Farming

### 5.1 Airdrop pipeline planner across major Solana protocols

**Behavioral evidence**  
There are dedicated guides and communities around farming Solana airdrops, listing top targets like Jupiter, MarginFi, Kamino, Meteora, and others, and describing multi‑wallet rotations and task lists. Telegram bots like Lootbot automate multi‑chain airdrop farming and monitoring, signaling demand for agentic workflows rather than one‑off tasks.[^47][^48][^6][^46][^27][^25]

**Raze workflow**  
- **Scenario**: User wants a structured, updated "quest list" rather than scattered threads.  
- **User message**: `"build me a weekly airdrop plan on solana for serious candidates only. I have 3 wallets and 2 hours a day."`  
- **Raze response**: Generates a prioritized checklist (e.g., use Jupiter perps, lend on MarginFi, LP on Kamino/Meteora, trade on Phoenix/Tensor), tracks completion per wallet, and periodically re‑scores opportunities using sentiment+funding data, while making fun of laziness: "you skipped 3 days, enjoy your smaller allocation."  
- **Pain today**: Users hop between airdrop calendars, individual project docs, and threads; there’s no unified, adaptive planner focused solely on Solana and integrated with actual on‑chain usage.[^48][^49][^15][^47]
- **Tools juggled**: Airdrop.io, Binance and blog guides, Lootbot, project‑specific quest sites.

### 5.2 Eligibility checks and "did I miss anything" audits

**Behavioral evidence**  
Tools like Jupiter Airdrop Checker and multi‑chain airdrop checkers exist to tell users if they qualify for campaigns, and guides stress using them to avoid missing rewards. Users often have multiple wallets and are unsure whether they "did enough" activity on each.[^49][^46][^48]

**Raze workflow**  
- **Scenario**: Airdrop farmer post‑snapshot wants to ensure nothing is left unclaimed.  
- **User message**: `"scan all my wallets, list recent and active sol airdrops I qualify for, and tell me which ones I’m short on activity for next season."`  
- **Raze response**: Queries eligibility APIs and activity, summarizes claim links and missed criteria, and nags: "you bridged once and left. that’s not farming, that’s tourism."  
- **Pain today**: Users must run checks per wallet per protocol; aggregation across wallets, plus guidance on "what to keep farming" is rare.[^6][^48][^49]
- **Tools juggled**: Jupiter checker, airdrop dashboards, protocol UIs, spreadsheets.

***

## 6. DAO Governance and Participation

### 6.1 Explaining and routing DAO votes in plain language

**Behavioral evidence**  
Guides on Solana governance describe Realms/Tribeca workflows, SPL‑governance proposals, stake delegation, and validator voting, but the steps are complex and CLI‑heavy in some cases. Many users do not participate because of UX friction.[^50][^51][^52][^53][^54][^55]

**Raze workflow**  
- **Scenario**: Token holder wants to vote on a protocol DAO but finds Realms confusing.  
- **User message**: `"explain this new $XYZ dao proposal in 2 sentences and tell me whether it’s pro‑ or anti‑holder. then route me to vote."`  
- **Raze response**: Fetches proposal text/metadata, summarizes key changes, surfaces likely trade‑offs, and deep‑links to the Realms/Tribeca vote page, with commentary: "this spends 20% of the treasury on airdrops for dev friends. vote how salty you feel."  
- **Pain today**: Requires reading technical governance docs and navigating unfamiliar UIs; few tools provide contextual summaries and action routing inside Telegram.[^51][^52][^56]
- **Tools juggled**: Realms web app, protocol docs, Twitter governance threads.

### 6.2 Ongoing governance concierge for staked SOL

**Behavioral evidence**  
Governance guides highlight that SOL stakers can delegate and participate in many proposals but must track forums and vote windows. This is time‑consuming and under‑utilized.[^52][^54][^55][^51]

**Raze workflow**  
- **Scenario**: Long‑term SOL holder stakes but doesn’t track governance.  
- **User message**: `"I staked 500 SOL. from now on, alert me to major governance proposals impacting inflation, fees, or validator rules and give a short take with pros/cons."`  
- **Raze response**: Monitors governance feeds, pings when relevant proposals appear, and summarizes with context like: "proposal 123 cuts staking rewards by 5% to fund grants; good for devs, meh for your yield."  
- **Pain today**: Users must manually follow forums, governance dashboards, and Twitter; there is no Telegram‑native AI governance concierge for Solana.
- **Tools juggled**: Realms, docs, governance blogs.

***

## 7. NFTs and Compressed NFTs

### 7.1 Floor‑sniping NFT collections with token‑style analytics

**Behavioral evidence**  
Solana NFT marketplaces like Tensor, Magic Eden, and Hadeswap offer advanced trading views, orderbooks, and AMM‑style pools, targeting traders rather than collectors. Users often compare volumes and fees across marketplaces to decide where to trade.[^57][^58][^19]

**Raze workflow**  
- **Scenario**: NFT trader wants to treat collections like tokens: momentum, holder quality, and liquidity.  
- **User message**: `"track DeGods floor and show me when buy volume, unique buyers, and whale entries all spike at once. DM me when it happens."`  
- **Raze response**: Watches marketplace APIs, aggregates volume/floor/unique buyers, tags known whales, and sends an alert: "degods waking up: floor +18%, 3 known whales sweeping, listings thinning. want to grab 1 via Tensor?"  
- **Pain today**: Users must keep Tensor/Magic Eden tabs open and eyeball stats; no AI agent in Telegram summarizes NFT collection micro‑structure and triggers.
- **Tools juggled**: Tensor, Magic Eden, Hadeswap, Sniper, custom Discord/Telegram alerts.[^58][^57][^19]

### 7.2 Compressed NFT analytics for airdrop/points games

**Behavioral evidence**  
Compressed NFTs are used heavily on Solana for scalable loyalty/points systems; farmers track which interactions matter for future rewards through Discord and docs rather than unified tools. Airdrop guides explicitly mention NFTs and participation badges as eligibility factors.[^47][^48][^19]

**Raze workflow**  
- **Scenario**: User participating in a points campaign using compressed NFTs (mints from quests, games, etc.).  
- **User message**: `"look at my NFTs across these games/protocols and tell me which ones are actually likely to matter for airdrops or perks."`  
- **Raze response**: Maps NFTs to protocols, checks known campaigns and historical airdrop patterns, and ranks them: "these 3 likely matter (similar to past Jito/Jupiter patterns), these look like vanity."  
- **Pain today**: Requires manual reading of campaign docs plus scanning NFT inventories; there are no smart NFT "importance" scores integrated with wallet views.
- **Tools juggled**: Wallet UIs, NFT marketplaces, campaign docs, airdrop guides.

***

## 8. DeFi Yield Optimization

### 8.1 Yield pathfinder across staking, restaking, and LPs

**Behavioral evidence**  
Solana DeFi users discuss combining liquid staking (e.g., Jito), lending (MarginFi), LPing (Raydium, Orca, Hadeswap), and leveraged yield on protocols like Tulip, weighing yield vs risk. Guides emphasize not allocating more than a small portion to untested protocols and setting stop‑losses on LP or leveraged positions.[^26][^1][^34][^25][^20]

**Raze workflow**  
- **Scenario**: User holds idle SOL/USDC and wants optimized but sane yields.  
- **User message**: `"i’ve got 200 SOL and 5k USDC doing nothing. find me a yield plan under ‘medium degen’ risk and execute the safe parts."`  
- **Raze response**: Proposes options like: stake part of SOL with Jito/LST, lend USDC on MarginFi/Kamino, small LP on Raydium/Orca with clear IL risk explanation; it then routes actual stake/lend/LP actions via WalletConnect where feasible, plus sets monitoring alerts for IL or LTV limits.  
- **Pain today**: Users must discover protocols, compare yields and risk, and manually track positions and health across dashboards and defillama‑type sites.[^34][^25][^20]
- **Tools juggled**: Raydium, Orca, MarginFi, Jito, Tulip dashboards, third‑party yield aggregators.

### 8.2 Health monitoring for leveraged yield positions

**Behavioral evidence**  
Guides to leveraged farming on Tulip and others stress monitoring health factors/LTV and warn how quickly positions can liquidate; users ask which tools to use and how to track them safely. Risk frameworks recommend caps per leveraged/NFT position and hard LTV stops.[^25][^26][^34]

**Raze workflow**  
- **Scenario**: User has leveraged LPs or staked/borrow positions on Solana.  
- **User message**: `"watch my Tulip and MarginFi positions and scream at me before liquidation. also auto‑suggest partial de‑leveraging when LTV is spicy."`  
- **Raze response**: Monitors LTV/health factor via DeFi protocol APIs, pushes alerts when threshold approaches, and suggests exact repay/withdraw amounts routed via Jupiter swaps, with commentary: "you’re 3% from liquidation. pay back 400 USDC now or embrace voluntary homelessness."  
- **Pain today**: Requires dedicated protocol dashboards and constant manual checking; few Telegram bots tie DeFi health monitoring into conversational risk coaching.[^34][^25]
- **Tools juggled**: Tulip/DeFi dashboards, portfolio trackers, alert bots.

***

## 9. Tax, Accounting, and Reporting

### 9.1 "Year in review" and tax prep assistant

**Behavioral evidence**  
Crypto tax products like Koinly and guides for Solana specifically show users exporting Solana wallet data via API/CSV or explorers like Solscan, then tagging staking, DeFi, and airdrops manually before generating reports. Users complain about fragmented data and the complexity of tagging everything correctly.[^59][^60][^61][^62][^63][^28]

**Raze workflow**  
- **Scenario**: At tax time, user wants everything ready for Koinly or their accountant.  
- **User message**: `"generate a 2025 summary for my sol wallets: total trades, realized gains/losses, major airdrops, and a CSV formatted for Koinly. translate it into human words too."`  
- **Raze response**: Compiles transaction history via Helius, groups taxable events, tags common DeFi patterns, outputs Koinly‑compatible CSV plus a plain‑English summary: "you realized X profit, lost Y on rugs, and farmed Z in airdrops; here are the 10 biggest events."  
- **Pain today**: Requires multiple exports from Solscan, wallet apps, and CEXes plus manual tagging and reconciliation before importing to tax software.[^60][^61][^62][^59][^28]
- **Tools juggled**: Solscan CSV export, wallet history, Koinly/other tax tools, spreadsheets.

### 9.2 Tagging complex DeFi and NFT events in real time

**Behavioral evidence**  
Tax tools often cannot auto‑detect certain DeFi actions or require manual tagging for staking, LPing, restaking, and NFT events. Guides stress tagging airdrops and forks as income and differentiating between swaps vs internal transfers.[^61][^62][^63][^60][^28]

**Raze workflow**  
- **Scenario**: Active DeFi/NFT user wants fewer surprises at tax time.  
- **User message**: `"from now on, every time I do something weird on sol (lp, stake, mint NFTs, get airdrops), log it in a tax sheet with basic labels I can export later."`  
- **Raze response**: For each relevant transaction, appends a structured row to a running log with type (trade, income, DeFi), token, value, and a short note, and pings occasionally: "tagged your Jito rewards as staking income and that rug as a capital loss candidate."  
- **Pain today**: Users either ignore real‑time tagging or rely entirely on imperfect automatic classification later.[^60][^28]
- **Tools juggled**: On‑chain explorers, Koinly, manual spreadsheets.

***

## 10. Onboarding and Safety / Emergency Scenarios

### 10.1 Onboarding CEX users to Solana DeFi safely

**Behavioral evidence**  
Wallet and dapp guides explain what dapps are, how to use Solana wallets (Phantom, Solflare), and basic patterns like connecting, signing, and avoiding scams. Many security articles highlight users being drained after interacting with malicious dapps or fake support in Discord/Telegram.[^64][^65][^66][^67][^19]

**Raze workflow**  
- **Scenario**: User’s friend wants to try Solana but has never used a self‑custody wallet.  
- **User message**: `"walk my friend through setting up phantom, funding from binance, and doing 1 safe swap on jup. narrate like they’re five and warn about every scam angle."`  
- **Raze response**: Step‑by‑step guidance: create wallet, save seed, fund from CEX, make a tiny test swap, verify in explorer; at each step, Raze injects anti‑scam advice and roasts risky behavior: "if anyone in tg DMs you for your seed, block them and touch grass."  
- **Pain today**: Users must piece together docs, random tutorials, and security threads; there is no in‑chat agent that tailors onboarding and safety advice to actual actions.[^65][^66][^64][^19]
- **Tools juggled**: Phantom/Solflare docs, CEX help centers, security blogs, Reddit.

### 10.2 Real‑time response when a wallet is compromised

**Behavioral evidence**  
There are recurring Reddit posts where users realize their Solana wallets are compromised due to malicious approvals, fake support, or leaked keys, asking what to do next. Security guidance urges users to treat drained wallets as permanently compromised and immediately move funds to new wallets and revoke approvals.[^68][^66][^67][^12][^64][^65]

**Raze workflow**  
- **Scenario**: User notices suspicious approvals or partial drains.  
- **User message**: `"i think my wallet got popped. what’s the fastest way to evacuate and clean up?"`  
- **Raze response**: Detects recent malicious program interactions, generates urgent steps: create new wallet, move remaining funds via safe paths, revoke known approvals, and optionally broadcast warning to user’s group; Raze can auto‑prepare transfer/signing flows via WalletConnect and narrate: "stop touching the hacked wallet. we’re airlifting your remaining bags now."  
- **Pain today**: Users scramble across Reddit, Discord, and explorer tools while under stress; there is no 1‑click emergency playbook tied to their actual wallet data.[^66][^67][^68][^64][^65]
- **Tools juggled**: Explorers, revoke tools, wallet apps, community support.

### 10.3 Rug/exploit detection and exit coordination

**Behavioral evidence**  
News reports of Solana bots/wallets being exploited (e.g., BONKbot/Solareum incidents, widespread wallet drains) show users confused about the cause and official guidance, and being told to move to new wallets and avoid interacting with unknown helpers. Token scam checklists stress monitoring liquidity pulls and freeze authority changes as immediate red flags.[^69][^70][^11][^12][^65]

**Raze workflow**  
- **Scenario**: User holds a token that suddenly tanks or gets suspicious contract changes.  
- **User message**: `"razor, is $XYZ getting rugged right now? should i GTFO?"`  
- **Raze response**: Checks LP status, dev wallet activity, freeze/mint authority changes, and recent large sells; if rug traits detected, it responds: "liquidity down 90%, dev wallets dumping; this is a live rug, not ‘healthy correction.’ sign here to bail to SOL."  
- **Pain today**: Requires fast manual cross‑checking across RugCheck, explorers, and Twitter; many users freeze and do nothing.[^70][^11][^12][^69]
- **Tools juggled**: RugCheck, explorers, social feeds, bots.

***

## 11. Analogous Products on Other Chains & Lessons for Raze

### 11.1 Telegram trading and airdrop bots (Ethereum/Base and multi‑chain)

**Evidence**  
- Unibot, Maestro, and similar Ethereum/Base bots pioneered Telegram‑native swaps, sniping, copy trading, and PnL tracking.[^46][^71][^6]
- Lootbot and other multi‑chain airdrop bots automate onchain actions, eligibility checks, and farming across networks including Solana.[^6][^46]
- Drops Bot provides multi‑chain price alerts, wallet tracking, and now in‑bot trading with TP/SL from alerts, blurring the line between notifications and execution.[^8]

**Lessons for Raze**  
- Execution + monitoring inside Telegram is already validated; users accept bots as full trading terminals.[^46][^39][^8][^6]
- What is missing is opinionated AI guidance, narrative explanation, and multi‑source research in natural language.

### 11.2 AI‑powered portfolio/rebalancing agents

**Evidence**  
- AgentV on Base is an AI portfolio rebalancing agent that runs on‑chain and exposes a Telegram interface, using both off‑chain indicators and on‑chain data for rebalancing decisions.[^35]
- CEX bots like KuCoin Smart Rebalance use AI/ML‑assisted allocation and automatic threshold/time‑based rebalancing.[^36]
- Older bots like Pamela (Telegram portfolio rebalancing on CEXes) illustrate long‑standing demand for hands‑off risk management via chat.[^37]

**Lessons for Raze**  
- Raze can port these concepts to Solana DEX + self‑custody: narrative‑aware portfolio targets, AI‑designed allocations per risk tier, and auto‑suggested rebalancing swaps via Jupiter.

### 11.3 Gaps in Solana tooling

By surveying Solana‑specific trading bot guides, PnL trackers, airdrop checkers, DeFi tutorials, NFT marketplaces, and governance docs, several unserved niches emerge:

- **AI‑native research + execution in Telegram**: Solana Telegram bots are overwhelmingly execution‑first (sniping, swaps, copy trading, alerts) with basic safety checks; none offer cross‑source research, narrative explanation, or sarcastic coaching by default.[^2][^3][^39][^8][^6][^46]
- **Lifecycle‑wide wallet concierge**: There is no single agent that tracks the same wallet from airdrop farming through DeFi, NFTs, governance, tax tagging, and emergency response on Solana. Most tools focus on one vertical (PnL, taxes, NFTs, airdrops) in silo.[^62][^4][^18][^25][^60]
- **Group‑context intelligence**: Alpha groups rely on human callers plus generic bots; no agent reads group context, checks contracts live, and responds with both data and banter tailored to the group.[^41][^40][^9]
- **Governance explainer + router**: Realms/Tribeca UX is powerful but intimidating; there is space for a "governance butler" that turns proposals into yes/no questions with direct vote routing, especially via mobile.[^56][^51][^52]
- **DeFi health coach**: While DeFi UIs and some trackers show LTV/health, few deliver proactive, conversational coaching on Solana’s leveraged yield stack inside Telegram.[^26][^25][^34]

***

## 12. How Raze’s Personality Amplifies Product Fit

The sarcastic, brutally honest, crypto‑native persona is not just branding; it directly addresses pain points surfaced in community posts and guides:

- Traders often ignore dry warnings; humorous, harsh reminders about over‑allocation or chasing rugs are more memorable and shareable in group chats.[^21][^11][^9]
- Callers and alpha groups thrive on culture; an agent that can both provide serious on‑chain analysis and meme‑able one‑liners becomes part of the social fabric, not just a utility.[^2][^40]
- Many guides emphasize "learning to read the chain" rather than blindly copying; a roasting AI that explains *why* something is dangerous or promising helps users actually level up, not just execute.[^11][^9][^10]

Positioned correctly, Raze can own the "thinking bot" niche on Solana: an always‑on chain analyst, risk manager, and sarcastic co‑pilot that turns the fragmented, multi‑tool reality of Solana trading into one continuous chat‑native workflow.

---

## References

1. [What tools or projects are good for trading in Solana? - Reddit](https://www.reddit.com/r/solana/comments/17nrsin/what_tools_or_projects_are_good_for_trading_in/) - Drift is my perp platform of choice. Swaps is Jupiter. Bank is MarginFi. Liquid staking is Jito.

2. [Solana Telegram Bots: Complete Guide for Traders](https://cryptotrade.wiki/en/articles/solana-telegram-bots/) - Discover how Solana Telegram bots work, their features, UX, and security. Explore Trojan, BONKbot, M...

3. [Top 4 Solana Telegram Trading Bots | CoinGecko](https://www.coingecko.com/learn/solana-telegram-trading-bots) - Discover the best Solana Telegram trading bots, their key features, and how to get started in this i...

4. [Top Solana Portfolio Tracker: Manage Your SOL Assets 2025 - Zerion](https://zerion.io/blog/solana-portfolio-tracker-comprehensive-guide/) - This guide breaks down what a Solana portfolio tracker is. You'll learn about different options. And...

5. [Track Solana Wallet PnL with Top Tools](https://crypto.techguide.org/solana-wallet-pnl-tracker) - Track Solana wallet PnL with top tools like Birdeye and CoinStats.

6. [Best Telegram Crypto Bots For 2026 - Trading, Solana, Base & More](https://coinsutra.com/telegram-crypto-bots/) - 1. Lootbot – Telegram Crypto Airdrop farming bot. Telegram Trading Bot – Best Telegram Bot for Tradi...

7. [Overview - Shuriken Alpha](https://docs.shuriken.trade/telegram-bot/overview) - Telegram Bot is Shuriken's Telegram trading interface.Buy and sell tokens on Solana, BSC, and Monad ...

8. [Drops Bot Review: Multi-Chain Crypto Price Alerts Bot in Telegram](https://dropstab.com/research/drops-bot-the-crypto-price-alerts-bot-for-telegram) - Drops Bot is a crypto price alerts bot on Telegram. Get real-time updates on prices, wallets, token ...

9. [How Smart Solana Traders Use On Chain Data to Find Early ...](https://www.altcointrading.net/how-smart-solana-traders-use-on-chain-data-to-find-early-opportunities/) - Learn how profitable Solana traders use on-chain analytics, wallet tracking, and real-time data tool...

10. [Solana Honeypot Checkers, Token Sniffers & Contract Scanners](https://memegateway.com/academy/solana-honeypot-checkers-contract-scanners/) - Learn how to use honeypot checkers, token sniffers, and contract scanners on Solana to avoid rugs. Y...

11. [Solana Token Scam Checklist (2026) | 30-Second Safety Check](https://solanasniperbot.net/solana-token-scam-checklist/) - Five on-chain checks for honeypots, rug pulls, and fee traps. Spot scams in 30 seconds before you bu...

12. [Beware of Solana Token Scams: How to Spot and Avoid Honeypots](https://www.reddit.com/r/solana/comments/1dk6xdi/beware_of_solana_token_scams_how_to_spot_and/)

13. [Made a tool that tracks every wallet to find trends : r/solana - Reddit](https://www.reddit.com/r/solana/comments/1kirqbj/made_a_tool_that_tracks_every_wallet_to_find/) - It finds trade events by filtering program id's (popular dex's) in both a transactions inner & outer...

14. [Best tools for automated trading on Solana? - Reddit](https://www.reddit.com/r/solana/comments/1kbcd65/best_tools_for_automated_trading_on_solana/) - Create a custom bot and you can do more advanced things like tracking volume spikes, analyzing trend...

15. [2026 Guide to Airdrop Farming: How to Farm Airdrops Securely](https://www.adspower.com/blog/guide-to-airdrop-farming-how-to-farm-airdrops-securely) - Airdrop farming is a rising strategy, letting crypto users earn free tokens across multiple blockcha...

16. [DIY or Copy Trading: What's actually worked for you on Solana?](https://www.reddit.com/r/solana/comments/1kc8h4k/diy_or_copy_trading_whats_actually_worked_for_you/) - I've had more luck DIYing, tracking volume and holder growth seems to give me a better edge than cop...

17. [Solana Wallet Analytics Telegram Tool - GitHub](https://github.com/katlogic/solana-wallet-analytics-telegram-tool) - ... Solana blockchain. This Telegram bot provides comprehensive wallet analytics with advanced filte...

18. [Solana PnL Tracker - Real Profit and Loss - Wallet Master](https://www.walletmaster.tools/solana-pnl-tracker/) - Check real PnL for any Solana wallet address. 150+ metrics per wallet - profit, ROI, win rate, trade...

19. [What Are dApps? A Simple Guide for Crypto Newbies - Solflare](https://www.solflare.com/crypto-101/what-are-dapps-a-simple-guide-for-crypto-newbies/) - Some of the most popular NFT marketplaces to explore on Solana are Magic Eden, Tensor, Solanart and ...

20. [Yield farming or Staking- Which of the two is better ...](https://www.reddit.com/r/solana/comments/129jok2/yield_farming_or_staking_which_of_the_two_is/) - I've been exploring the different ways one can earn passive income on the Solana blockchain and yiel...

21. [Made $1.5M in meme coins. Here's what actually worked for me.](https://www.reddit.com/r/TheRaceTo10Million/comments/1i1kbto/made_15m_in_meme_coins_heres_what_actually_worked/) - Solana is a cesspool right now, you're only hope as I see it is sub ... How do you research crypto? ...

22. [How do you keep track of your wallet/coins PnL?](https://www.reddit.com/r/solana/comments/1dtqkn0/how_do_you_keep_track_of_your_walletcoins_pnl/lbb73nu/) - How do you keep track of your wallet/coins PnL?

23. [Building a Professional Solana Wallet Tracking Telegram Bot](https://dev.to/imcrazysteven/building-a-professional-solana-wallet-tracking-telegram-bot-16od) - This article gives you a comprehensive guide to building a professional Solana wallet monitoring...

24. [Solana Wallet Tracking Telegram Bot - GitHub](https://github.com/imcrazysteven/Solana-Wallet-Tracking-Telegram-Bot-Portfolio) - A professional Solana wallet tracking bot that monitors transactions, calculates pnl and delivers re...

25. [Tulip Protocol Breakdown & Leveraged Yield Farming ...](https://www.reddit.com/r/solana/comments/sq640g/tulip_protocol_breakdown_leveraged_yield_farming/) - Skip to main content Tulip Protocol Breakdown & Leveraged Yield Farming Tutorial : r/solana ... Tuli...

26. [Any good DeFi protocols on solana?](https://www.reddit.com/r/defi/comments/1gi25bx/any_good_defi_protocols_on_solana/) - I'm trying to use a few DeFi protocols on solana. Any recommendations ... How to Maximize Passive In...

27. [How to Maximize Passive Income with Solana DeFi (Yield ...](https://www.reddit.com/r/solana/comments/1k5u9nm/how_to_maximize_passive_income_with_solana_defi/) - That's why I started r/DeFiYieldClub, a community dedicated to finding and sharing the best yield fa...

28. [Koinly: Free Crypto Tax Software](https://koinly.io) - Easily Calculate Your Crypto & NFT Taxes ⚡ Supports 800+ exchanges ᐉ Coinbase ✓ Eth ✓ Solana. ✅ View...

29. [GitHub - gsnode/solana-telegram-trading-bot: A code to create your own telegram bot for trading tokens in Solana](https://github.com/gsnode/solana-telegram-trading-bot) - A code to create your own telegram bot for trading tokens in Solana - gsnode/solana-telegram-trading...

30. [Is there a DEX that supports stop-loss?](https://www.reddit.com/r/solana/comments/1aspsu4/is_there_a_dex_that_supports_stoploss/)

31. [Dex with spot order stop loss? : r/solana - Reddit](https://www.reddit.com/r/solana/comments/1if3wdm/dex_with_spot_order_stop_loss/) - However, you can't set a limit order (or stop loss) at 220 USD ... How to create a stop loss on sola...

32. [Solana DEX vs CEX: Which Is Better for Trading in 2026?](https://learn.backpack.exchange/articles/solana-dex-vs-cex) - Use a Solana CEX if: You are trading larger amounts and require deeper liquidity. You need advanced ...

33. [openclaw-solana-quickstart/config/AGENTS.md at master - GitHub](https://github.com/solana-clawd/openclaw-solana-quickstart/blob/master/config/AGENTS.md) - ... solana-clawd/openclaw-solana ... Stop Loss: Always set 10% stop loss on entry; Portfolio Limit: ...

34. [Solana DeFi in 2026: Top 7 Protocols for 50%+ Real Yield](https://earnpark.com/en/posts/solana-defi-fast-chains-real-yield-smart-strategies/) - ... stop-loss to break-even. ... By layering liquid staking, audited lending, and selective LP expos...

35. [AgentV Bot - ETHGlobal](https://ethglobal.com/showcase/agentv-bot-o5zfm) - AgentV is an autonomous, AI-powered crypto portfolio rebalancing agent designed to run on the Base L...

36. [Smart Rebalance Trading Bot: Diversify Your Crypto Portfolio Like a ...](https://www.kucoin.com/learn/trading-bot/smart-rebalance-trading-bot) - The smart rebalance strategy in crypto trading auto-adjusts the portfolio at regular intervals to ma...

37. [luizParreira/pamela: Pamela is a Telegram Cryptocurrency ... - GitHub](https://github.com/luizParreira/pamela) - Pamela is a Telegram Cryptocurrency automatic portfolio rebalancing bot - luizParreira ... crypto ex...

38. [Top Crypto Portfolio Rebalancing Tools For 2026 (Automated ...](https://coinsutra.com/crypto-portfolio-rebalancing-tools/) - Here are best crypto portfolio rebalancing tools which will let you rebalance and backtest your cryp...

39. [Best Solana Telegram Trading Bots 2026: Which One Is Fastest?](https://learn.backpack.exchange/articles/best-telegram-trading-bots-on-solana) - Solana Telegram trading bots enable instant memecoin trading with fast execution and low fees ... Wh...

40. [Best Telegram Groups for Solana Memecoin Trading and Pump.Fun ...](https://www.reddit.com/r/MemecoinSeason/comments/1gynzr7/best_telegram_groups_for_solana_memecoin_trading/) - Below, I've listed the top Telegram groups for Solana memecoin trading ... Pair BullX with an expert...

41. [Best Telegram Crypto bots on Solana 2026](https://hackers.tools/explore/solana/telegram-bots?page=2) - LootBot is a multi-chain airdrop farming automated assistant working both as a Telegram bot and term...

42. [pumpfun-raydium-cli-tools/README.md at main · hexnome/pumpfun-raydium-cli-tools](https://github.com/hexnome/pumpfun-raydium-cli-tools/blob/main/README.md) - solana pumpfun bundler, raydium bundler, pumpfun sniping bot, raydium sniping bot, pumpfun volume bo...

43. [chainstacklabs/pumpfun-bonkfun-bot: A fully functional pump.fun ...](https://github.com/chainstacklabs/pumpfun-bonkfun-bot) - A fully functional pump.fun / letsbonk.fun trading and sniping bot not relying on any 3rd party APIs...

44. [My Trading Experience: How I Finally Found the Right Tools ... - Reddit](https://www.reddit.com/r/solana/comments/1hqma6i/my_trading_experience_how_i_finally_found_the/) - I wanted to share my trading journey and the lessons I've learned along the way. It's been a bit of ...

45. [SpyBot: Solana Wallet Tracker on Telegram - Solanabox.tools](https://solanabox.tools/tools/spybot) - Track and analyze Solana wallet transactions with SpyBot. Get instant updates and insights directly ...

46. [Best Solana Trading Bot | GetBlock.io](https://getblock.io/blog/best-sol-trading-bot/) - If one wants to streamline Solana token trading, using the Telegram bot is a good decision. ... Aird...

47. [Farming Airdrops On Solana: A Definitive Guide To Earn Free Crypto](https://cryptopuncher.com/farming-airdrops-on-solana-to-earn-free-crypto/) - Want free crypto? Learn how farming airdrops on Solana blockchain/ecosystem can make you rich. Earn ...

48. [Solana Airdrop Guide: Top Airdrop Farms 2024](https://www.binance.com/en/square/post/14133366917074) - September 27 2024 What Are the Top Solana Airdrops in 2024? MeteoraJupiterPhoenix TradeTensorBackpac...

49. [6 Best Airdrop Checkers: Find Crypto Airdrops on Solana, Ethereum ...](https://www.mexc.co/news/682066) - The post 6 Best Airdrop Checkers: Find Crypto Airdrops on Solana, Ethereum & More appeared on Bitcoi...

50. [VOTE! First Governance Advisory Vote by Validators](https://forum.solana.com/t/vote-first-governance-advisory-vote-by-validators/597) - I am now initiating a first advisory vote by validators on a key question of governance: “Who should...

51. [How to Participate in Solana Governance: A Step-by-Step Guide](https://crypto.com/us/university/how-to-participate-in-solana-governance) - Staking SOL tokens on-chain gives users the opportunity to participate in Solana governance. Here’s ...

52. [Solana Governance Guide: Voting, Proposals & DAO Structure - OKX](https://www.okx.com/en-us/learn/solana-governance-guide) - OKX United States - Learn how Solana governance works: protocol voting, SIMD proposals, DAO creation...

53. [spl-governance - Realms](https://docs.realms.today/developer-resources/spl-governance)

54. [Solana Governance: A Comprehensive Analysis - Helius](https://www.helius.dev/blog/solana-governance--a-comprehensive-analysis) - Ethereum's DAO Fork in 2016, which led to the creation of Ethereum Classic, remains a cautionary exa...

55. [Solana Governance Guide: Voting, Proposals & DAO Structure | OKXwww.okx.com › learn › solana-governance-guide](https://www.okx.com/learn/solana-governance-guide) - OKX - Learn how Solana governance works: protocol voting, SIMD proposals, DAO creation, and hands-on...

56. [How to Participate in Solana Governance: A Step-by-Step Guide](https://crypto.com/en/university/how-to-participate-in-solana-governance) - This guide shows how to participate in the Solana decentralised autonomous organisation (DAO), as we...

57. [Top 10 Solana NFT Marketplaces: A Guide to Navigating the ...](https://getblock.io/blog/top-10-solana-nft-marketplaces-a-guide-to-navigating-the-ecosystem/) - Hadeswap stands out as a decentralized NFT trading platform on Solana, seamlessly integrating an Aut...

58. [DeGods (Solana) NFT Floor Price Chart - CoinGecko](https://www.coingecko.com/en/nft/degods-solana) - DeGods (Solana) (DGOD) price floor today is $471.28, with a 24 hour sales volume of 81.62 SOL. As of...

59. [Export CSV Transaction History on Solscan](https://info.solscan.io/export-csv-report-on-solscan/) - Export your full transaction history as a CSV report on Solscan with filters and date ranges for fas...

60. [How to file your Solana (SOL) taxes with Koinly](https://koinly.io/integrations/sol/) - Solana pairs perfectly with Koinly to make SOL tax easy! 🤝Sync Solana with Koinly to calculate your ...

61. [How to Connect Solflare Wallet with Koinly for Easy Solana Tax Reporting](https://labsonape.io/how-to-connect-solflare-wallet-with-koinly-for-easy-solana-tax-reporting/)

62. [How To Do Your Solana Crypto Tax FAST With Koinly](https://www.youtube.com/watch?v=1YGETfhOxMU) - Trading with Solana ? Not sure how to do your crypto tax? Worried about the IRS or your country’s ta...

63. [How To Do Your Solana Taxes FAST With Koinly](https://www.youtube.com/watch?v=mLLHg2VTpA0) - Trading with Solana? Not sure how to do your crypto tax? Worried about the IRS or your country’s tax...

64. [Safety practices in Solana: the best tips](https://smithii.io/en/best-secure-practices-solana/) - Your wallet is at constant risk when you involve Web3 in your day-to-day business. Learn about these...

65. [Solana wallets 'compromised and abandoned' as users ...](https://cointelegraph.com/news/solana-wallets-compromised-and-abandoned-as-users-warned-of-scam-solutions) - Solana users are urged to transfer funds to hardware wallets and centralized exchanges following a w...

66. [my wallet got compromised and i need some help pls (i know it was dumb)](https://www.reddit.com/r/solana/comments/1hlxa7v/my_wallet_got_compromised_and_i_need_some_help/) - my wallet got compromised and i need some help pls (i know it was dumb)

67. [My Solana Wallet Compromised/Hacked](https://www.reddit.com/r/solana/comments/1atgi6i/my_solana_wallet_compromisedhacked/)

68. [Is my wallet compromised? Do I just need another one now? Halp](https://www.reddit.com/r/solana/comments/18hqmjx/is_my_wallet_compromised_do_i_just_need_another/) - Is my wallet compromised? Do I just need another one now? Halp

69. [Telegram Bots BONKbot and Solareum Users Suffer ...](https://forklog.com/en/telegram-bots-bonkbot-and-solareum-users-suffer-520000-losses-due-to-hacks/)

70. [Solana Telegram Trading Bot to Shut Down After Users ...](https://cryptonews.net/en/28803619/) - The team behind Solareum, a Telegram trading app for buying and selling Solana-based tokens on the p...

71. [I Built a Solana Trading Bot for Telegram — Here's How It Works](https://dev.to/tatelyman/i-built-a-solana-trading-bot-for-telegram-heres-how-it-works-1d33) - I built a full-featured Solana trading bot for Telegram After studying how bots like...

