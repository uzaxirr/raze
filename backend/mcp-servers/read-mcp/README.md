# Solana MCP Server (Lean Version)

Natural language Solana blockchain queries via Helius RPC and Claude AI.

## Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Add your API keys to .env:
   # - ANTHROPIC_API_KEY (from Claude)
   # - HELIUS_API_KEY (from Helius)
   ```

3. **Run the server:**
   ```bash
   python server.py
   ```

## Features

Query Solana blockchain using natural language:
- "What's the balance of wallet ABC..."
- "Show me recent USDC transactions"
- "Get the last 5 SOL transfers"
- "Analyze transaction fees"

## Available Tool

### `solana_transaction_lookup`

Query Solana blockchain data using natural language or structured parameters.

**Parameters:**
- `query` (optional): Natural language query
- `wallet` (optional): Direct wallet address
- `action` (optional): Specific action (get_balance, get_transactions, etc.)
- `token_mint` (optional): Token address or symbol
- `limit` (optional): Max results (default: 100)

**Examples:**
```python
# Natural language
query="Show me the balance of wallet ABC..."

# Structured
action="get_balance", wallet="..."
action="get_transactions", wallet="...", limit=50
```

## Supported Actions

- `get_balance`: Get SOL and token balances
- `get_transactions`: Get recent transactions
- `get_token_transfers`: Get specific token transfers
- `get_native_transfers`: Get SOL transfers only
- `analyze_fees`: Analyze transaction fees

## Configuration

Set in `.env` file:

**Required:**
- `ANTHROPIC_API_KEY`: Claude API key
- `HELIUS_API_KEY`: Helius RPC API key

**Optional:**
- `CLAUDE_MODEL`: Model to use (default: claude-3-5-sonnet-20241022)
- `RPC_TIMEOUT_SECONDS`: Timeout for RPC calls (default: 30)
- `CACHE_TTL_SECONDS`: Cache duration (default: 30)
- `DEBUG`: Enable debug output (default: false)

## Claude Desktop Integration

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "solana-mcp": {
      "command": "python",
      "args": ["/path/to/mcp-servers/read-mcp/server.py"]
    }
  }
}
```

## Architecture

This is a lean, single-file MCP server implementation:
- **server.py**: All functionality in one file (~500 lines)
- **No subdirectories**: Flat structure for simplicity
- **Minimal dependencies**: Only essential packages
- **Direct implementation**: No unnecessary abstractions