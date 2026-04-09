#!/usr/bin/env python3
"""
Unified runner for all MCP servers and the main agent.
Run with: python run_all.py
"""
import asyncio
import signal
import subprocess
import sys
from pathlib import Path

# ANSI colors for log prefixes
COLORS = {
    "read-mcp": "\033[94m",           # Blue
    "sns-resolver": "\033[92m",       # Green
    "token-data": "\033[95m",         # Magenta
    "transaction-executor": "\033[96m", # Cyan
    "price-alerts": "\033[91m",       # Red
    "market-research": "\033[32m",    # Dark Green
    "agent": "\033[93m",              # Yellow
    "price-monitor": "\033[90m",      # Gray
    "webhook-receiver": "\033[33m",   # Orange
    "migrations": "\033[36m",         # Cyan
    "reset": "\033[0m",
}

# MCP servers (start first)
MCP_SERVERS = [
    {
        "name": "read-mcp",
        "cmd": ["fastmcp", "run", "server.py", "--transport", "sse", "--port", "8001"],
        "cwd": "mcp-servers/read-mcp",
    },
    {
        "name": "sns-resolver",
        "cmd": ["fastmcp", "run", "server.py", "--transport", "sse", "--port", "8002"],
        "cwd": "mcp-servers/sns-resolver",
    },
    {
        "name": "token-data",
        "cmd": ["fastmcp", "run", "server.py", "--transport", "sse", "--port", "8003"],
        "cwd": "mcp-servers/token-data",
    },
    {
        "name": "transaction-executor",
        "cmd": ["fastmcp", "run", "server.py", "--transport", "sse", "--port", "8004"],
        "cwd": "mcp-servers/transaction-executor",
    },
    {
        "name": "price-alerts",
        "cmd": ["fastmcp", "run", "server.py", "--transport", "sse", "--port", "8005"],
        "cwd": "mcp-servers/price-alerts",
    },
    {
        "name": "market-research",
        "cmd": ["fastmcp", "run", "server.py", "--transport", "sse", "--port", "8007"],
        "cwd": "mcp-servers/market-research",
    },
]

# Main agent
AGENT = {
    "name": "agent",
    "cmd": ["python3", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7777", "--reload"],
    "cwd": ".",
}

# Price monitor service (background task)
PRICE_MONITOR = {
    "name": "price-monitor",
    "cmd": ["python3", "main.py"],
    "cwd": "services/price_monitor",
}

# Webhook receiver (for Helius transaction alerts)
WEBHOOK_RECEIVER = {
    "name": "webhook-receiver",
    "cmd": ["python3", "main.py"],
    "cwd": "services/webhook_receiver",
}

processes = []


def run_migrations():
    """Run database migrations before starting services."""
    base_path = Path(__file__).parent
    db_path = base_path / "db"
    c = COLORS["migrations"]
    r = COLORS["reset"]
    err = COLORS["price-alerts"]

    print(f"\n{c}[migrations]{r} Running database migrations...")

    try:
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            cwd=db_path,
            capture_output=True,
            text=True,
            timeout=60
        )

        if result.returncode == 0:
            # Check if there were any migrations applied
            if "Running upgrade" in result.stdout:
                print(f"{c}[migrations]{r} Migrations applied successfully")
                for line in result.stdout.strip().split('\n'):
                    if line.strip():
                        print(f"  {line}")
            else:
                print(f"{c}[migrations]{r} Database is up to date ✓")
        else:
            print(f"{err}[migrations]{r} Migration failed!")
            print(f"  stderr: {result.stderr}")
            sys.exit(1)

    except subprocess.TimeoutExpired:
        print(f"{err}[migrations]{r} Migration timed out!")
        sys.exit(1)
    except FileNotFoundError:
        print(f"{err}[migrations]{r} alembic not found - skipping migrations")


async def stream_output(process, name: str):
    """Stream process output with colored prefix."""
    color = COLORS.get(name, "")
    reset = COLORS["reset"]
    prefix = f"{color}[{name}]{reset}"

    async def read_stream(stream):
        while True:
            line = await stream.readline()
            if not line:
                break
            text = line.decode().rstrip()
            print(f"{prefix} {text}")

    await asyncio.gather(
        read_stream(process.stdout),
        read_stream(process.stderr),
    )


async def start_service(service: dict, base_path: Path):
    """Start a single service."""
    name = service["name"]
    cmd = service["cmd"]
    cwd = base_path / service["cwd"]

    color = COLORS.get(name, "")
    reset = COLORS["reset"]

    print(f"{color}[{name}]{reset} Starting in {cwd}...")

    process = await asyncio.create_subprocess_exec(
        *cmd,
        cwd=cwd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    processes.append(process)

    await stream_output(process, name)


async def run_all():
    """Run all services - MCP servers first, then agent after delay."""
    base_path = Path(__file__).parent

    # Run migrations first
    run_migrations()

    print("\n" + "=" * 60)
    print("Starting all services...")
    print("=" * 60)
    print(f"  {COLORS['read-mcp']}read-mcp{COLORS['reset']}             -> http://0.0.0.0:8001")
    print(f"  {COLORS['sns-resolver']}sns-resolver{COLORS['reset']}         -> http://0.0.0.0:8002")
    print(f"  {COLORS['token-data']}token-data{COLORS['reset']}           -> http://0.0.0.0:8003")
    print(f"  {COLORS['transaction-executor']}transaction-executor{COLORS['reset']} -> http://0.0.0.0:8004")
    print(f"  {COLORS['price-alerts']}price-alerts{COLORS['reset']}         -> http://0.0.0.0:8005")
    print(f"  {COLORS['market-research']}market-research{COLORS['reset']}      -> http://0.0.0.0:8007")
    print(f"  {COLORS['agent']}agent{COLORS['reset']}                -> http://0.0.0.0:7777")
    print(f"  {COLORS['price-monitor']}price-monitor{COLORS['reset']}        -> background service")
    print(f"  {COLORS['webhook-receiver']}webhook-receiver{COLORS['reset']}     -> http://0.0.0.0:8010")
    print("=" * 60)
    print("Press Ctrl+C to stop all services\n")

    # Start MCP servers first
    mcp_tasks = [asyncio.create_task(start_service(svc, base_path)) for svc in MCP_SERVERS]

    # Wait for MCP servers to initialize
    print(f"\n{COLORS['agent']}[system]{COLORS['reset']} Waiting 2 seconds for MCP servers to initialize...\n")
    await asyncio.sleep(2)

    # Start agent
    agent_task = asyncio.create_task(start_service(AGENT, base_path))

    # Start price monitor service
    price_monitor_task = asyncio.create_task(start_service(PRICE_MONITOR, base_path))

    # Start webhook receiver (for Helius transaction alerts)
    webhook_receiver_task = asyncio.create_task(start_service(WEBHOOK_RECEIVER, base_path))

    # Wait for all tasks
    await asyncio.gather(*mcp_tasks, agent_task, price_monitor_task, webhook_receiver_task)


def shutdown(signum, frame):
    """Handle shutdown signal."""
    print("\n\nShutting down all services...")
    for proc in processes:
        try:
            proc.terminate()
        except Exception:
            pass
    sys.exit(0)


if __name__ == "__main__":
    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    try:
        asyncio.run(run_all())
    except KeyboardInterrupt:
        shutdown(None, None)
