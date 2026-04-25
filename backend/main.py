import os
import logging
import asyncio
from contextlib import asynccontextmanager
from agno.agent import Agent
from agno.tools.mcp import MCPTools
from agno.tools.workflow import WorkflowTools
from agno.os import AgentOS
from agno.models.anthropic import Claude
from agno.db.postgres import PostgresDb
from fastapi import FastAPI

from workflows.token_sniper import token_sniper_workflow
from agent_prompt import RAZE_SYSTEM_PROMPT
from bouncer_prompt import build_bouncer_instructions

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://localhost:5432/razedb")
# Ensure DATABASE_URL uses psycopg driver for SQLAlchemy (Railway/Neon provide postgresql://)
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

db = PostgresDb(
    db_url=DATABASE_URL,
    db_schema="public",
)

read_mcp = MCPTools(
    transport="sse",
    url="http://127.0.0.1:8001/sse"
)

sns_resolver = MCPTools(
    transport="sse",
    url="http://127.0.0.1:8002/sse"
)

token_data = MCPTools(
    transport="sse",
    url="http://127.0.0.1:8003/sse"
)

transaction_executor = MCPTools(
    transport="sse",
    url="http://127.0.0.1:8004/sse"
)

price_alerts = MCPTools(
    transport="sse",
    url="http://127.0.0.1:8005/sse"
)

market_research = MCPTools(
    transport="sse",
    url="http://127.0.0.1:8007/sse"
)

sniper_workflow = WorkflowTools(
    workflow=token_sniper_workflow,
)

# List of all MCP tools to pre-connect
ALL_MCP_TOOLS = [read_mcp, sns_resolver, token_data, transaction_executor, price_alerts, market_research]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Pre-connect all MCP servers at startup for faster first request."""
    logger.info("Pre-connecting MCP servers...")

    async def connect_mcp(mcp: MCPTools, name: str):
        try:
            await mcp.connect()
            logger.info(f"Connected to {name}")
        except Exception as e:
            logger.warning(f"Failed to pre-connect {name}: {e}")

    # Connect all MCP servers in parallel
    await asyncio.gather(
        connect_mcp(read_mcp, "read-mcp"),
        connect_mcp(sns_resolver, "sns-resolver"),
        connect_mcp(token_data, "token-data"),
        connect_mcp(transaction_executor, "transaction-executor"),
        connect_mcp(price_alerts, "price-alerts"),
        connect_mcp(market_research, "market-research"),
    )
    logger.info("All MCP servers pre-connected")

    yield

    # Cleanup on shutdown
    logger.info("Disconnecting MCP servers...")
    for mcp in ALL_MCP_TOOLS:
        try:
            await mcp.close()
        except Exception:
            pass


agent = Agent(
    name="Raze",
    model=Claude(
        id="claude-sonnet-4-20250514",
        cache_system_prompt=True,
        extended_cache_time=True,
    ),
    tools=[
        # ReasoningTools(add_instructions=True),  # Agent decides when to think deeply
        read_mcp, sns_resolver, token_data, transaction_executor,
        price_alerts, market_research, sniper_workflow
    ],
    db=db,
    # debug_mode=True,
    enable_user_memories=False,  # Disabled — Claude Sonnet doesn't support structured outputs required by Agno memory
    add_memories_to_context=False,
    add_history_to_context=True,
    add_session_summary_to_context=True,
    store_history_messages=True,
    num_history_runs=10,  # Only send last 10 runs to prevent context bloat
    enable_session_summaries=True,  # Summarize older exchanges

    # Context
    add_session_state_to_context=True,
    add_datetime_to_context=True,
    timezone_identifier="UTC",
    markdown=True,
    session_state={
        "wallet_address": None,
        "wallet_id": None,
        "telegram_username": None,
        "telegram_user_id": None,
        "created_at": None,
        "signing_mode": "internal",
        "external_wallet_address": None,
        "preferred_wallet_app": "phantom",
        "message_sent_at": None,
    },
    instructions=RAZE_SYSTEM_PROMPT,
)

# Bouncer agent — gatekeeper for waitlist, read-only tools
bouncer_agent = Agent(
    name="Bouncer",
    model=Claude(
        id="claude-sonnet-4-20250514",
        cache_system_prompt=True,
    ),
    debug_mode=True,
    tools=[
        read_mcp, sns_resolver, token_data, transaction_executor, market_research,
    ],
    db=db,
    enable_user_memories=True,
    add_memories_to_context=True,
    add_history_to_context=True,
    add_session_summary_to_context=True,
    store_history_messages=True,
    num_history_runs=10,  # Only send last 10 runs to prevent context bloat
    enable_session_summaries=True,  # Summarize older exchanges
    add_session_state_to_context=True,
    add_datetime_to_context=True,
    timezone_identifier="UTC",
    markdown=True,
    session_state={
        "telegram_username": None,
        "telegram_user_id": None,
        "position": None,
        "referral_count": None,
        "referral_code": None,
        "bouncer_step": 0,
        "message_sent_at": None,
    },
    instructions=build_bouncer_instructions,
)

agent_os = AgentOS(
    agents=[agent, bouncer_agent],
    workflows=[token_sniper_workflow],
    lifespan=lifespan,
    db=db,
)
app = agent_os.get_app()

# CORS — allow frontend to call backend API
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://raze.fun", "http://localhost:3000", "http://localhost:3004", "https://os.agno.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the v2 signing sessions API
from api.sign_sessions import router as sign_router
app.include_router(sign_router)

if __name__ == "__main__":
    agent_os.serve(app="main:app", reload=True)