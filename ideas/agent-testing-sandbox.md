# AI Agent Testing Sandbox for Solana

## Status: PARKED — exploring options

## Context
250K+ daily active agents on Solana. 68% of new DeFi protocols ship with AI agents. OpenAI built EVMbench for EVM — nothing equivalent exists for Solana. Developers deploy agents to mainnet and pray.

## Concept
Testing environment to simulate AI agents against Solana state before deploying to production. Pre-built attack scenarios, fuzzing, economic simulations. Like a CI pipeline for agent safety.

## Example Usage
```bash
$ agentbench test ./my_agent.py \
    --scenario "jupiter_swap_slippage_attack" \
    --scenario "rpc_timeout_during_stake" \
    --scenario "price_oracle_manipulation" \
    --fund 100_SOL_devnet

Results:
├── jupiter_swap_slippage_attack: FAILED ❌
│   → Agent accepted 15% slippage, lost 12 SOL
│   → Suggestion: Add max_slippage parameter
├── rpc_timeout_during_stake: PASSED ✓
│   → Agent retried with backoff correctly
└── price_oracle_manipulation: FAILED ❌
    → Agent used single oracle source
    → Suggestion: Aggregate Pyth + Switchboard
```

## Revenue
- Free for devnet testing
- $49/mo for mainnet fork testing
- $199/mo for custom scenarios + CI integration

## Competition
- EVMbench (OpenAI): EVM only, not Solana
- No Solana-specific agent testing tool exists
- Generic AI agent testing tools (AgentOps, etc.) don't understand Solana primitives

## Colosseum Fit
Developer tooling — Colosseum invested in Txtx and Tokamai for this exact category.

## Finding-First-Customer
- Workaround: Testing on devnet manually, deploying to mainnet with small amounts, hoping for the best
- Paid workaround: Tier 1 (free, high-friction) — no one is paying for this yet
- Urgency: High — 250K daily agents, growing attack surface, post-Drift fear
- 10x delta: Automated scenario testing vs. manual devnet fumbling
- Independent parallel invention: None for Solana
- Verdict: INTERVIEW AND CHARGE — hackathon teams building agents need QA

## Skill Fit (PERFECT)
- HackerRank workspaces (testing infrastructure at scale)
- Agno (agent frameworks)
- Civo DevEx (Terraform providers, SDKs, CLI tools)
- Colosseum explicitly invests in dev tooling
