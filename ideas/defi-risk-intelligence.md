# Solana DeFi Risk Intelligence Agent

## Status: PARKED — exploring options

## Context
Drift was hacked for $270M on April 1, 2026. Every DeFi user on Solana is asking "is my money safe?" No product gives real-time risk assessment of DeFi positions across protocols.

## Concept
Connect your wallet → AI agent continuously monitors your exposure across all DeFi positions. Combines authority monitoring, TVL tracking, durable nonce scanning, price feeds, and protocol health into one risk score.

## Example Output
```
/risk-check wallet.sol

Portfolio Risk Report:
├── Kamino USDC vault: LOW RISK ✓ (TVL stable, no authority changes)
├── Marinade stSOL: LOW RISK ✓ (6.08% APY, 100+ validators)
├── MarginFi lending: MEDIUM RISK ⚠ (utilization at 89%, liquidation at $120 SOL)
└── Protocol X yield: HIGH RISK 🚨
    → Program authority changed 2 hours ago
    → Durable nonce created by unknown signer
    → TVL dropped 15% in last 4 hours
    → RECOMMENDATION: Withdraw immediately
```

## Revenue
- $19/mo individual
- $99/mo power user (more wallets, SMS alerts)
- $499/mo protocols who want to embed it

## Why It's a Product
- Combines multiple data sources no single tool covers
- Post-Drift fear = distribution engine
- Colosseum invests in both security tooling and DeFi

## Finding-First-Customer
- Workaround: Manually checking each protocol's TVL, authority accounts, social feeds for red flags
- Paid workaround: Tier 3 — Nansen ($150+/mo), Blockaid (enterprise)
- Urgency: MAXIMUM — Drift hack 5 days ago
- 10x delta: Real-time automated monitoring vs. finding out after funds are gone
- Verdict: CHARGE NOW — every DeFi user at Network State wants this

## Skill Fit
- Multi-agent orchestration (one agent per risk dimension)
- Go indexer for real-time monitoring
- Solana DeFi knowledge from pocketwallet
