# Solana MCP Agent

A Solana blockchain assistant powered by Agno AI agents, MCP (Model Context Protocol) servers, and a Telegram bot interface.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Telegram Bot  │────▶│   AgentOS API   │────▶│   MCP Servers   │
│   (tg-bot/)     │     │   (main.py)     │     │                 │
└─────────────────┘     └─────────────────┘     ├─────────────────┤
        ▲                      │                │  read-mcp       │
        │                      │                │  sns-resolver   │
        │                      ▼                │  token-data     │
        │               ┌─────────────────┐     │  tx-executor    │
        │               │   PostgreSQL    │     │  price-alerts   │
        │               │   (Railway)     │     │  predictions    │
        │               └─────────────────┘     └─────────────────┘
        │                      ▲
        │                      │
┌───────┴─────────┐     ┌──────┴──────────┐     ┌─────────────────┐
│ Webhook Receiver│◀────│  Helius API     │◀────│ Solana Blockchain│
│ (Railway)       │     │  (Webhooks)     │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Wallet Transaction Notifications

Real-time wallet monitoring using Helius webhooks:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     WALLET ALERT FLOW                                    │
└──────────────────────────────────────────────────────────────────────────┘

1. USER CREATES ALERT (via Telegram)
   ┌──────────┐    "watch wallet X"    ┌──────────┐    create_wallet_alert()
   │ Telegram │ ─────────────────────▶ │  Agent   │ ──────────────────────▶
   │   User   │                        │ (main.py)│
   └──────────┘                        └──────────┘
                                            │
                                            ▼
   ┌──────────────────────────────────────────────────────────────────────┐
   │  PostgreSQL (Railway)                                                │
   │  ┌─────────────────┐    ┌─────────────────┐                         │
   │  │  user_profiles  │    │  wallet_alerts  │                         │
   │  │  - user_id      │◀───│  - user_id (FK) │                         │
   │  │  - wallet_addr  │    │  - watched_wallet│                         │
   │  └─────────────────┘    │  - wallet_label │                         │
   │                         │  - is_active    │                         │
   │                         └─────────────────┘                         │
   └──────────────────────────────────────────────────────────────────────┘
                                            │
                                            ▼
   ┌──────────────────────────────────────────────────────────────────────┐
   │  Helius Webhook API                                                  │
   │  - Adds wallet address to webhook's accountAddresses[]               │
   │  - Webhook ID stored in helius_webhook_config table                  │
   └──────────────────────────────────────────────────────────────────────┘


2. TRANSACTION OCCURS ON WATCHED WALLET
   ┌──────────────┐    Transaction    ┌──────────────┐
   │   Solana     │ ────────────────▶ │   Helius     │
   │  Blockchain  │                   │   Indexer    │
   └──────────────┘                   └──────────────┘
                                            │
                                            │ POST /webhook/helius
                                            ▼
   ┌──────────────────────────────────────────────────────────────────────┐
   │  Webhook Receiver (Railway)                                          │
   │  services/webhook_receiver/server.py                                 │
   │                                                                      │
   │  1. Verify auth header (HELIUS_WEBHOOK_AUTH_HEADER)                 │
   │  2. Parse HeliusTransaction payload                                  │
   │  3. Extract all involved accounts (feePayer, transfers, etc.)       │
   │  4. Query wallet_alerts for watchers                                 │
   │  5. Send Telegram notification to each watcher                       │
   │  6. Inject memory into AgentOS (so agent recalls notification)      │
   └──────────────────────────────────────────────────────────────────────┘
                                            │
                                            ▼
   ┌──────────┐    Notification     ┌──────────────┐
   │ Telegram │ ◀───────────────── │  Telegram    │
   │   User   │   "🔔 Wallet X     │    Bot API   │
   └──────────┘    did a swap..."  └──────────────┘
```

### Webhook Receiver Service

**Deployment:** Railway (separate service from main app)
**URL:** `https://webhook-receiver-production-90a8.up.railway.app`
**Port:** 8010

**Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/debug/db` | GET | Debug database state |
| `/webhook/helius` | POST | Receive Helius webhooks |

**Environment Variables:**
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Railway Postgres internal URL |
| `TELEGRAM_BOT_TOKEN` | Bot token for sending notifications |
| `HELIUS_WEBHOOK_AUTH_HEADER` | Auth header for webhook verification |
| `AGENTOS_BASE_URL` | AgentOS URL for memory injection |

**Database Tables:**

**wallet_alerts** - User wallet watch subscriptions:
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | BIGINT | FK to user_profiles |
| watched_wallet | VARCHAR(64) | Solana address to watch |
| wallet_label | VARCHAR(64) | Optional nickname |
| is_active | BOOLEAN | Alert enabled/disabled |
| created_at | TIMESTAMP | Creation timestamp |

**helius_webhook_config** - Master webhook configuration:
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| webhook_id | VARCHAR(128) | Helius webhook ID |
| webhook_url | VARCHAR(512) | Webhook receiver URL |
| created_at | TIMESTAMP | Creation timestamp |

## Prerequisites

- Python 3.9+
- PostgreSQL (running on localhost:5432)
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))
- Privy API credentials (for wallet creation)
- Birdeye API key (for token data)

## Quick Start

### 1. Clone and Install Dependencies

```bash
# Install main dependencies
pip install -r requirements.txt

# Install Telegram bot dependencies
cd tg-bot && pip install -r requirements.txt && cd ..
```

### 2. Set Up PostgreSQL Database

```bash
# Create database
createdb razedb

# Run migrations
cd db && alembic upgrade head && cd ..
```

### 3. Configure Environment Variables

**Main Agent** - Create `.env` in root:
```env
DATABASE_URL=postgresql+psycopg://localhost:5432/razedb
```

**Telegram Bot** - Create `tg-bot/.env`:
```env
TELEGRAM_BOT_TOKEN=your_bot_token
AGENTOS_BASE_URL=http://localhost:7777
PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret
```

**Token Data MCP** - Create `mcp-servers/token-data/.env`:
```env
BIRDEYE_API_KEY=your_birdeye_api_key
```

### 4. Run All Services

```bash
# Start all MCP servers + Agent (recommended)
python run_all.py

# Or run individually:
# Terminal 1: MCP servers
cd mcp-servers/read-mcp && fastmcp run server.py --transport sse --port 8001
cd mcp-servers/sns-resolver && fastmcp run server.py --transport sse --port 8002
cd mcp-servers/token-data && fastmcp run server.py --transport sse --port 8003

# Terminal 2: Agent
python -m uvicorn main:app --host 0.0.0.0 --port 7777 --reload

# Terminal 3: Telegram bot
cd tg-bot && python main.py
```

## Project Structure

```
solagent/
├── main.py                 # Agno agent + AgentOS setup
├── run_all.py              # Unified service runner
├── requirements.txt        # Main dependencies
├── Dockerfile              # Main app (supervisord)
├── Dockerfile.webhook-receiver  # Webhook receiver service
│
├── db/                     # Database layer (SQLAlchemy + Alembic)
│   ├── models.py           # UserProfile, WalletAlert, etc.
│   ├── database.py         # Connection setup
│   └── alembic/            # Migrations
│       └── versions/       # Migration files
│
├── tg-bot/                 # Telegram bot
│   ├── main.py             # Bot entry point
│   ├── src/
│   │   ├── bot.py          # Handlers and commands
│   │   ├── config.py       # Configuration
│   │   ├── privy.py        # Wallet creation client
│   │   └── formatters.py   # Message formatting
│   └── requirements.txt
│
├── services/               # Background services
│   ├── webhook_receiver/   # Helius webhook handler (Railway)
│   │   ├── server.py       # FastAPI app
│   │   ├── main.py         # Entry point
│   │   └── requirements.txt
│   └── price_monitor/      # Price alert monitor
│
├── shared/                 # Shared utilities
│   └── helius_webhooks.py  # Helius API client
│
└── mcp-servers/            # MCP tool servers
    ├── read-mcp/           # Solana RPC queries (port 8001)
    ├── sns-resolver/       # SNS domain resolution (port 8002)
    ├── token-data/         # Birdeye token data (port 8003)
    ├── transaction-executor/ # Transaction building (port 8004)
    ├── price-alerts/       # Price & wallet alerts (port 8005)
    └── prediction-markets/ # Prediction markets (port 8006)
```

## Database

### Schema

**user_profiles** - Telegram user data:

| Column            | Type         | Description                    |
|-------------------|--------------|--------------------------------|
| id                | SERIAL       | Primary key                    |
| telegram_user_id  | BIGINT       | Telegram user ID (unique)      |
| telegram_username | VARCHAR(255) | Telegram username              |
| wallet_address    | VARCHAR(64)  | Solana wallet address          |
| wallet_id         | VARCHAR(64)  | Privy wallet ID                |
| created_at        | TIMESTAMP    | Creation timestamp             |
| updated_at        | TIMESTAMP    | Last update timestamp          |

**user_preferences** - User settings and preferences:

| Column            | Type         | Description                    |
|-------------------|--------------|--------------------------------|
| id                | SERIAL       | Primary key                    |
| user_id           | BIGINT       | FK to user_profiles            |
| tone              | VARCHAR(20)  | Response tone preference       |
| verbosity         | VARCHAR(20)  | Response detail level          |
| risk_tolerance    | VARCHAR(20)  | Trading risk preference        |
| default_slippage  | FLOAT        | Default swap slippage %        |
| favorite_tokens   | TEXT[]       | Array of favorite token mints  |
| price_alert_style | VARCHAR(20)  | Alert notification style       |
| experience_level  | VARCHAR(20)  | User experience level          |
| created_at        | TIMESTAMP    | Creation timestamp             |
| updated_at        | TIMESTAMP    | Last update timestamp          |

### Database Migrations

Migrations are managed with [Alembic](https://alembic.sqlalchemy.org/). All migration commands should be run from the `db/` directory.

```bash
cd db
```

#### Check Current Status

```bash
# Show current migration revision
alembic current

# Show full migration history
alembic history --verbose
```

#### Apply Migrations

```bash
# Apply all pending migrations (run this after pulling new code)
alembic upgrade head

# Apply next migration only
alembic upgrade +1

# Upgrade to specific revision
alembic upgrade <revision_id>
```

#### Create New Migrations

```bash
# Auto-generate migration from model changes
alembic revision --autogenerate -m "add_new_table"

# Create empty migration (for custom SQL)
alembic revision -m "custom_migration"
```

After generating, always review the migration file in `db/alembic/versions/` before applying.

#### Rollback Migrations

```bash
# Rollback one migration
alembic downgrade -1

# Rollback to specific revision
alembic downgrade <revision_id>

# Rollback all migrations (dangerous!)
alembic downgrade base
```

#### Troubleshooting

**"relation does not exist" error:**
```bash
# Check if migrations are pending
alembic current
alembic upgrade head
```

**Migration conflicts (multiple heads):**
```bash
# Show all heads
alembic heads

# Merge heads
alembic merge heads -m "merge_migrations"
```

**Reset migration state (development only):**
```bash
# Drop alembic_version table and rerun
psql razedb -c "DROP TABLE alembic_version;"
alembic upgrade head
```

## MCP Servers

### read-mcp (Port 8001)
Solana blockchain queries via RPC:
- `get_balance` - Get SOL balance for a wallet
- `get_token_accounts` - Get SPL token balances
- `get_recent_transactions` - Get transaction history
- `get_transaction_details` - Get detailed transaction info

### sns-resolver (Port 8002)
Solana Name Service resolution:
- `resolve_sns_domain` - Resolve .sol domain to address
- `reverse_lookup` - Get domain for an address

### token-data (Port 8003)
Birdeye API integration:
- `get_token_overview` - Token stats and price
- `get_trending_tokens` - Trending tokens list
- `get_token_holders` - Top token holders
- `get_token_creation_info` - Token creation details
- `search_tokens` - Search by name/symbol

## Telegram Bot Commands

| Command   | Description                          |
|-----------|--------------------------------------|
| `/start`  | Create wallet / Welcome message      |
| `/wallet` | View your wallet address             |
| `/clear`  | Reset conversation history           |
| `/help`   | Show help message                    |

## Service Ports

| Service | Port | URL |
|---------|------|-----|
| read-mcp | 8001 | http://localhost:8001/sse |
| sns-resolver | 8002 | http://localhost:8002/sse |
| token-data | 8003 | http://localhost:8003/sse |
| transaction-executor | 8004 | http://localhost:8004/sse |
| price-alerts | 8005 | http://localhost:8005/sse |
| prediction-markets | 8006 | http://localhost:8006/sse |
| AgentOS | 7777 | http://localhost:7777 |
| webhook-receiver | 8010 | http://localhost:8010 |

### Railway Deployment

| Service | URL |
|---------|-----|
| solagent-app | https://solagent-app-production.up.railway.app |
| webhook-receiver | https://webhook-receiver-production-90a8.up.railway.app |
| PostgreSQL | postgres.railway.internal:5432 (internal only) |

## Development

### Adding a New MCP Server

1. Copy template: `cp -r mcp-servers/template-mcp mcp-servers/your-server`
2. Edit `server.py` with your tools
3. Add to `run_all.py` MCP_SERVERS list
4. Add to `main.py` MCPTools configuration

### Adding Database Migrations

1. **Modify models**: Edit `db/models.py` with your schema changes
2. **Generate migration**:
   ```bash
   cd db && alembic revision --autogenerate -m "add_feature_name"
   ```
3. **Review migration**: Check generated file in `db/alembic/versions/`
   - Verify the `upgrade()` and `downgrade()` functions are correct
   - Alembic may miss some changes (e.g., column renames) - edit manually if needed
4. **Test locally**: `alembic upgrade head`
5. **Commit both** the model changes and migration file together

### Environment Variables

| Variable           | Location           | Description                    |
|--------------------|--------------------|--------------------------------|
| DATABASE_URL       | Root .env          | PostgreSQL connection string   |
| TELEGRAM_BOT_TOKEN | tg-bot/.env        | Telegram bot token             |
| AGENTOS_BASE_URL   | tg-bot/.env        | AgentOS API URL                |
| PRIVY_APP_ID       | tg-bot/.env        | Privy app ID                   |
| PRIVY_APP_SECRET   | tg-bot/.env        | Privy app secret               |
| BIRDEYE_API_KEY    | token-data/.env    | Birdeye API key                |

## License

MIT
