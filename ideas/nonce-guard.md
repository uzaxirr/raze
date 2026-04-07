# Nonce Guard — Post-Drift Transaction Security Monitor

## Status: PARKED — liked, not pursuing now

## Context
Drift was hacked for $270M on April 1, 2026. North Korean state actors used Solana's durable nonce feature to pre-sign malicious transactions that stayed valid for weeks. Every protocol with a multisig is now terrified. No monitoring tool exists for this attack vector.

## Concept
Real-time monitoring service for Solana multisigs and program authorities:
- Watch for durable nonce account creation linked to your program/multisig
- Alert when pre-signed transactions are detected
- Show pending nonce-based transactions and their potential impact
- Auto-notify all multisig members on suspicious nonces
- Dashboard: outstanding approvals, nonce lifetimes, risk scores

## Revenue
$99-499/mo per program monitored. Even 10 protocols at $199/mo = $2K/mo.

## Market
- Drift hack: $270M stolen April 1, 2026 via durable nonce exploitation
- Solana audits cost $60K-130K — this is a fraction of that for ongoing monitoring
- Blockaid does tx simulation but doesn't catch pre-signed nonce-based attacks
- No competitor exists for this specific attack vector

## Tech Stack
- Go indexer watching for durable nonce account creation
- gRPC streaming alerts to multisig members
- Dashboard for outstanding approvals and risk scoring

## Finding-First-Customer
- Workaround: Protocols manually checking durable nonce accounts (if they even know to look)
- Paid workaround: Tier 3 — security audits ($60K-130K), Blockaid (enterprise pricing)
- Urgency: MAXIMUM — 5 days since $270M hack
- Independent parallel invention: None — first mover opportunity
- 10x delta: Automated real-time monitoring vs. finding out after funds are gone
- Verdict: CHARGE NOW — DM protocol teams directly
