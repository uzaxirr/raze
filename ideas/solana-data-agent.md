# Solana Data Agent — Natural Language On-Chain Intelligence

## Status: PARKED — strong interest, exploring more options

## Concept
Natural language interface for querying Solana on-chain data. Ask complex cross-data questions in plain English, get instant answers. Multi-agent orchestration decomposes queries across SNS resolution, transaction history, price data, and DeFi protocol decoding.

## Example Queries
- "when did toly.sol first receive bonk? what was the price then vs now?"
- "what does the transaction history for <address> look like? biggest txn last week?"
- "show me all wallets that bought BONK before $0.01 and still hold it"
- "what DeFi positions does this wallet have across Jupiter, Marinade, Kamino?"

## Architecture
```
User query
├── SNS Agent: resolve .sol domains → addresses
├── History Agent: scan indexed tx history (Helius DAS API)
├── Price Agent: historical + current prices (Birdeye/Jupiter)
├── DeFi Agent: decode protocol interactions (Jupiter, Marinade, Kamino)
└── Synthesis Agent: correlate and generate NL answer
```

## Three Revenue Surfaces
1. **Consumer** — Telegram bot / web chat. Free (10 queries/day), Pro ($19/mo)
2. **Developer API** — MCP server + REST. Paid via x402 per query
3. **Agent-to-agent** — other AI agents pay to query Solana intelligence via x402

## Competition
| Product | Strength | Weakness |
|---------|----------|----------|
| DuneAI + MCP | 100+ chains, established | SQL-first, batch, not Solana-optimized |
| Solana ChatGPT Kit | Official | Shallow, basic queries only |
| Chainalysis AI | Deep investigations | Enterprise/law enforcement, rolling out summer |
| SOLMate | NL + wallet actions | Hackathon project, basic |
| Solscan/SolanaFM | Reliable explorers | Manual, no NL, no cross-data |

## Differentiation
- Solana-depth over multi-chain breadth
- Multi-agent orchestration for complex cross-data queries (5+ data sources in one question)
- SNS-native (.sol resolution is core, not bolted on)
- Real-time vs. Dune's batch processing

## Finding-First-Customer
- Workaround: Manually cross-referencing Solscan + Birdeye + SNS + DeFi dashboards (10-15 min per query)
- Paid workaround: Tier 3 — Dune Pro ($349/mo), Birdeye API, Helius API
- Independent parallel invention: 4+ (DuneAI, SOLMate, Chainalysis, Solana ChatGPT Kit)
- Urgency: Daily — people query wallets/tokens constantly
- 10x delta: 3 seconds vs. 10-15 min manual work
- Verdict: INTERVIEW AND CHARGE

## Concerns
- Can't index all Solana history in 5 weeks — need to lean on Helius/Birdeye initially
- DuneAI is the 800-lb gorilla long term
- "Chat with data" risks being a feature, not a product — Solana depth is the moat

## Why It Fits
- Pocketwallet's multi-agent orchestrator = same pattern (READ instead of WRITE)
- Go (indexer), Python (agents)
- SNS side track for hackathon
- Superteam distribution for early users via Telegram
