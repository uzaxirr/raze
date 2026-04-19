# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Personal OS & Strategic Context

This codebase is part of Uzaxir's multi-company work. Strategic context lives in the Obsidian vault and is imported below so every session in this codebase has full context without re-explaining.

- Vault conventions and scope rules: @/Users/uzaxirr/Obsidian/personal-os/CLAUDE.md
- Raze project-level context (goals, status, decisions): @/Users/uzaxirr/Obsidian/personal-os/04-projects/raze/CLAUDE.md

When strategic decisions are made in this session (pivots, new features, deadline changes), reflect them in `04-projects/raze/CLAUDE.md` in the vault so future sessions pick them up. Codebase-specific details (architecture, commands, deployment) stay in this file.

## Project Overview

Solana MCP Agent - A crypto trading assistant powered by Agno AI agents, MCP (Model Context Protocol) servers, and a Telegram bot interface. Users interact via Telegram to perform Solana blockchain operations through natural language.

**Stack:** Python 3.12+, Agno 2.3.21, FastMCP, PostgreSQL/SQLAlchemy/Alembic, xAI Grok-4, Telegram Bot API

## Common Commands

### Run All Services
```bash
python run_all.py
```

### Run Individual Services
```bash
# Agent (port 7777)
python -m uvicorn main:app --host 0.0.0.0 --port 7777 --reload

# Telegram bot
cd tg-bot && python main.py

# Individual MCP server (example)
cd mcp-servers/read-mcp && fastmcp run server.py --transport sse --port 8001
```

### Database Migrations
```bash
cd db

# Apply all pending migrations
alembic upgrade head

# Generate migration from model changes
alembic revision --autogenerate -m "description"

# Rollback one migration
alembic downgrade -1

# Check current status
alembic current
```

### Install Dependencies
```bash
pip install -r requirements.txt
cd tg-bot && pip install -r requirements.txt
```

## Architecture

```
Telegram Bot (tg-bot/) → AgentOS API (main.py:7777) → MCP Servers (ports 8001-8007)
                              ↓
                         PostgreSQL
                              ↑
Webhook Receiver (services/webhook_receiver/:8010) ← Helius Webhooks
```

### MCP Servers (mcp-servers/)
| Server | Port | Purpose |
|--------|------|---------|
| read-mcp | 8001 | Solana RPC queries via Helius |
| sns-resolver | 8002 | .sol domain resolution |
| token-data | 8003 | Birdeye token data |
| transaction-executor | 8004 | SOL/token transfers, Jupiter swaps |
| price-alerts | 8005 | Price alert management |
| prediction-markets | 8006 | Polymarket integration |
| market-research | 8007 | LunarCrush sentiment/news for data-backed decisions |

### Key Modules
- **main.py**: Agno agent setup, MCP connections, AgentOS FastAPI app
- **agent_prompt.py**: Agent personality/behavior (sarcastic crypto friend style)
- **hooks/mcp_hooks.py**: BYOMCP - injects user's custom MCP servers per request
- **db/models.py**: 8 SQLAlchemy models (user_profiles, wallet_alerts, user_mcp_servers, etc.)
- **tg-bot/src/bot.py**: Telegram command handlers, streaming responses

### BYOMCP (Bring Your Own MCP)
Users can add custom MCP servers via chat commands. Stored in `user_mcp_servers` table, injected per-request via pre-hooks. Supports API key and OAuth 2.1 authentication with automatic token refresh.

### Session State
Agent receives user context via session_state:
```python
{"wallet_address", "wallet_id", "telegram_username", "telegram_user_id", "solana_network"}
```

## Adding New Features

### New MCP Server
1. Create `mcp-servers/{name}/server.py` (keep <500 lines, follow MCP_SERVER_STANDARDS.md)
2. Create `requirements.txt` (minimal deps: fastmcp, python-dotenv)
3. Add to `run_all.py` MCP_SERVERS list
4. Add MCPTools entry in `main.py` (import, define, add to tools list, add to lifespan connect)
5. **For Railway deployment:**
   - Add to `supervisord.conf` (critical - server won't start without this!)
   - Add any new dependencies to `requirements-all.txt` (Dockerfile uses this, not requirements.txt)

### New Database Table
1. Add model to `db/models.py`
2. Run `cd db && alembic revision --autogenerate -m "description"`
3. Review generated migration in `db/alembic/versions/`
4. Apply with `alembic upgrade head`

### New Telegram Command
Add handler in `tg-bot/src/bot.py`

## Environment Variables

**Root .env**: DATABASE_URL, BIRDEYE_API_KEY, JUPITER_API_KEY, XAI_API_KEY, HELIUS_API_KEY, PRIVY_APP_ID, PRIVY_APP_SECRET, LUNARCRUSH_API_KEY, RAZE_REFERRAL_ACCOUNT, RAZE_REFERRAL_FEE_BPS, RAZE_TRANSFER_FEE_ACCOUNT, RAZE_TRANSFER_FEE_BPS

**tg-bot/.env**: TELEGRAM_BOT_TOKEN, AGENTOS_BASE_URL, PRIVY_APP_ID, PRIVY_APP_SECRET

## Revenue

### Swap Fees (Jupiter Referral)

Raze earns revenue via Jupiter's referral fee program on every swap.

- **Referral Account**: `2sZdpSqnggDWj1xMfrytd4Pum34wBjVW7KtyuknRgkGZ` (managed at [referral.jup.ag](https://referral.jup.ag/))
- **Fee**: 2% (200 bps) on every Jupiter swap. Jupiter takes 20%, Raze keeps 80% (1.6% effective)
- **Implementation**: `mcp-servers/transaction-executor/jupiter.py` — `platformFeeBps` in quote request + `feeAccount` in swap request
- **Token accounts created for**: SOL, USDC, USDT, jlUSDC, USD1, JLP
- **Works with both signing modes**: Fee is baked into the transaction at quote time, before signing
- **Env vars**: `RAZE_REFERRAL_ACCOUNT`, `RAZE_REFERRAL_FEE_BPS` (defaults hardcoded, overridable via env)
- **Tradeoff**: Adding `referralAccount` disables RFQ routing (Metis-only quotes). Slightly worse pricing but enables revenue.

### Transfer Fees (SOL & SPL Sends)

Raze earns a 1% fee on every SOL and SPL token transfer.

- **Fee Account**: `D4M5cGfxFW9jZ4uLL24HPYMYur2cRGPdDZDGFVitYqpJ` (regular wallet, not a Jupiter PDA)
- **Fee**: 1% (100 bps) deducted from the send amount. User sends 10 SOL → recipient gets 9.9 SOL, Raze gets 0.1 SOL.
- **Implementation**: `mcp-servers/transaction-executor/server.py` — extra transfer instruction added to `send_sol` and `send_token` transactions
- **SPL tokens**: For token sends, a fee ATA is auto-created on first transfer of each token type
- **Works with both signing modes**: Fee instruction is part of the transaction before signing
- **Env vars**: `RAZE_TRANSFER_FEE_ACCOUNT` (defaults to `D4M5c...`), `RAZE_TRANSFER_FEE_BPS` (defaults to 100)
- **Response includes**: `fee`, `amount_after_fee`, `fee_bps` fields so the bot can report fees transparently

## Testing the API

### Start All Services
```bash
python run_all.py
```
Wait for all MCP servers to initialize (check logs for "Connected to" messages).

### API Endpoints
- **Swagger Docs**: http://127.0.0.1:7777/docs
- **OpenAPI Spec**: http://127.0.0.1:7777/openapi.json
- **List Agents**: http://127.0.0.1:7777/agents

### Test Agent Run (Python)
```python
import httpx
import asyncio

async def test():
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "http://127.0.0.1:7777/agents/raze/runs",
            data={
                "message": "What is the social sentiment on bitcoin?",
                "stream": "false",
                "session_id": "test-session-001"
            }
        )
        print(response.json())

asyncio.run(test())
```

### Test Agent Run (curl)
```bash
curl -X POST 'http://127.0.0.1:7777/agents/raze/runs' \
  -F 'message=What is the social sentiment on bitcoin?' \
  -F 'stream=false' \
  -F 'session_id=test-001'
```

### Common API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/agents` | GET | List all agents |
| `/agents/{agent_id}/runs` | POST | Run agent (multipart/form-data) |
| `/sessions` | GET | List sessions |
| `/sessions/{session_id}` | GET | Get session details |
| `/memories` | GET | List agent memories |

### Test Individual MCP Server
```python
from mcp import ClientSession
from mcp.client.sse import sse_client

async def test_mcp():
    async with sse_client("http://127.0.0.1:8007/sse") as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            result = await session.call_tool("get_topic_summary", {"topic": "bitcoin"})
            print(result)
```

## Deployment

- **Railway**: Main app, webhook receiver, PostgreSQL (separate services)
- **Docker**: Multi-stage build with Rust IDLGuesser + Python runtime
- **Supervisor**: Manages MCP servers and agent locally via supervisord.conf

### Railway Deployment Checklist
When deploying changes to Railway:
1. **Dependencies**: Add to `requirements-all.txt` (NOT `requirements.txt` - Dockerfile uses requirements-all.txt)
2. **New MCP servers**: Add entry to `supervisord.conf`
3. **Force rebuild**: If caching issues, clear build cache in Railway dashboard or use `railway up --force`
4. **Check logs**: `railway logs --service raze-agent`

### Railway Deployment Rules (CRITICAL — follow these every time)

**Frontend deployment:**
1. ALWAYS deploy from the `frontend/` directory: `cd frontend && railway up --service frontend`
2. NEVER deploy frontend from repo root — Railpack/Nixpacks analyzes the upload directory and won't find the Node app
3. After `npm install` of new packages, ALWAYS `rm -f package-lock.json && npm install` to regenerate a clean lock file before deploying — `npm ci` on Railway requires lock file to be perfectly in sync
4. Next.js with `output: "standalone"` requires start command `node .next/standalone/server.js`, NOT `npm start` / `next start`
5. "Failed to find Server Action" errors after deploy are transient (stale cached requests) — not a real failure
6. **Node version: controlled via `frontend/nixpacks.toml`** — this is the ONLY reliable way to set the Node version. `.nvmrc`, `engines` in package.json, `NIXPACKS_NODE_VERSION`, `NODE_VERSION`, `RAILWAY_NODE_VERSION` env vars are ALL unreliable or get cached. Current setting: `nodejs_22` + `npm-10_x`
7. Do NOT set `buildCommand` in `railway.json` — it overrides Nixpacks' native install step and causes cache mount conflicts (`EBUSY`). Let Nixpacks handle `npm ci` + `npm run build` automatically
8. If Railway keeps using a cached old Node version, the only fix is `nixpacks.toml` — env vars and `.nvmrc` get ignored when the Docker layer is cached

**Backend deployment:**
1. Deploy from repo root: `railway up --service backend`
2. Backend uses `backend/Dockerfile` — set `RAILWAY_DOCKERFILE_PATH=backend/Dockerfile` if Railpack can't find it
3. New Python deps go in `requirements-all.txt` (NOT `requirements.txt`)
4. New MCP servers must be added to `supervisord.conf`

**Telegram bot deployment:**
1. Deploy from repo root: `railway up --service telegram-bot`
2. Uses `backend/Dockerfile.bot`

**General Railway rules:**
- `railway up` from a subdirectory uploads ONLY that directory's contents
- `railway up` from repo root uploads the entire repo — services that need a specific Dockerfile must have `RAILWAY_DOCKERFILE_PATH` set
- Railway CLI `railway logs` streams forever — use `&` + `sleep` + `kill` to capture output
- Railway CLI has no `service delete` command — delete services from the dashboard
- `railway run` executes commands locally with Railway env vars, NOT on the Railway container — internal hostnames like `*.railway.internal` won't resolve
- To run migrations on prod DB, use the public DATABASE_URL (from `railway variables --service Postgres --kv | grep PUBLIC`)

### Common Railway Errors
| Error | Cause | Fix |
|-------|-------|-----|
| `npm ci` lock file out of sync | Installed new npm packages without committing lock file | Run `npm install` locally, then deploy |
| `Railpack could not determine how to build` | Deployed from wrong directory or missing Dockerfile path | Deploy from correct directory or set `RAILWAY_DOCKERFILE_PATH` |
| `"next start" does not work with standalone` | Start command is `npm start` but Next.js uses standalone output | Change start command to `node .next/standalone/server.js` |
| `Failed to find Server Action "x"` | Stale cached requests from old deployment | Transient — ignore, or redeploy |
| `ImportError: OpenTelemetry packages required` | Missing deps in requirements-all.txt | Add opentelemetry-api, opentelemetry-sdk, openinference-instrumentation-agno |
| `Failed to connect to <MCPTools>` | MCP server not in supervisord.conf | Add [program:mcp-{name}] section to supervisord.conf |
| MCP timeout errors | External API too slow | Reduce API timeout to <10s (MCP client has 10s hard limit) |
| `Dockerfile does not exist` | Path relative to wrong root | Use path relative to repo root, deploy from repo root |

## Known Limitations

### prediction-markets (Dome API)
- `search` parameter doesn't work reliably in Dome API SDK
- `market_slug` requires **exact match** (e.g., `khamenei-out-as-supreme-leader-of-iran-by-january-31`)
- For best results, users should provide full market slug from Polymarket URL
- Client-side filtering on fetched results only searches top 100 markets by volume

### market-research (LunarCrush)
- API timeout set to 8s to fit within MCP's 10s client timeout
- `get_topic_summary` makes parallel API calls (news + posts) to stay within timeout
- Topic normalization: lowercase, only letters/numbers/spaces/#/$
