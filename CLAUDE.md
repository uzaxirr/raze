# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

**Root .env**: DATABASE_URL, BIRDEYE_API_KEY, JUPITER_API_KEY, XAI_API_KEY, HELIUS_API_KEY, PRIVY_APP_ID, PRIVY_APP_SECRET, LUNARCRUSH_API_KEY, DOME_API_KEY

**tg-bot/.env**: TELEGRAM_BOT_TOKEN, AGENTOS_BASE_URL, PRIVY_APP_ID, PRIVY_APP_SECRET

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

### Common Railway Errors
| Error | Cause | Fix |
|-------|-------|-----|
| `ImportError: OpenTelemetry packages required` | Missing deps in requirements-all.txt | Add opentelemetry-api, opentelemetry-sdk, openinference-instrumentation-agno |
| `Failed to connect to <MCPTools>` | MCP server not in supervisord.conf | Add [program:mcp-{name}] section to supervisord.conf |
| MCP timeout errors | External API too slow | Reduce API timeout to <10s (MCP client has 10s hard limit) |

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
