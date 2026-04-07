# Natural Language Solana Alert Engine

## Status: PARKED — exploring options

## Concept
Telegram bot where users set up custom Solana blockchain alerts in plain English. Combines whale watching, wallet tracking, DeFi position monitoring, and post-Drift security alerts (authority changes, durable nonces).

## Example Interactions
```
You: /alert tell me when any wallet buys more than $50K of BONK
Bot: ✓ Alert set. Monitoring all Jupiter/Raydium swaps for BONK purchases >$50K.

You: /alert notify me if toly.sol moves any SOL
Bot: ✓ Watching toly.sol (4wBqp...) for all SOL transfers.

You: /alert warn me if any program I've interacted with changes authority
Bot: ✓ Scanning your tx history... Found 12 programs. Monitoring authority accounts.

[2 hours later]
Bot: 🚨 ALERT: Program "XYZ Lending" authority transferred to new address
     15 min ago. You have $2,400 deposited. Review immediately.
```

## Differentiation
- Whale Alert / Nansen: not Solana-specific, not NL configurable
- No existing tool combines: price data + wallet activity + DeFi positions + security alerts
- Telegram-native = where 74% of Solana trading happens
- The Drift hack was an authority change nobody noticed for weeks — this catches it in minutes

## Revenue
- Free: 3 alerts
- Pro $9.99/mo: unlimited alerts + historical data
- Whale $49/mo: API access, webhooks, portfolio-wide monitoring

## Users by May 14
Every trader and DeFi user at Network State. "Want me to set up a Drift-style attack alert for your wallet?" is a universal yes right now.

## Finding-First-Customer
- Workaround: Manually watching Solscan, following CT whale trackers, checking protocol dashboards
- Paid workaround: Tier 3 — Nansen alerts, custom scripts, Discord bots
- Urgency: MAXIMUM post-Drift
- 10x delta: NL setup in 5 seconds vs. configuring webhooks/scripts
- Verdict: CHARGE NOW — fastest path to users of any idea

## Skill Fit
- Go (indexer/monitoring), Python (NL parsing, agents)
- Real-time distributed systems background
- SNS side track eligible (.sol domain resolution core to product)
- Superteam distribution via Telegram
