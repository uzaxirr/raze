# MCP Server Standardization Guidelines

## Core Principles

1. **Minimal by Default**: Start with the smallest possible implementation
2. **Single File First**: Use one `server.py` file unless complexity demands splitting
3. **Flat Structure**: No nested directories or complex hierarchies
4. **Essential Dependencies Only**: Avoid unnecessary packages

## Standard Directory Structure

### Simple Server (Default)
```
mcp-servers/
└── {server-name}/
    ├── server.py          # All code in one file (<500 lines)
    ├── requirements.txt   # Minimal dependencies
    ├── .env.example      # Environment template
    └── README.md         # Brief documentation
```

### Complex Server (Only When Necessary)
```
mcp-servers/
└── {server-name}/
    ├── server.py         # Main entry & FastMCP setup
    ├── tools.py          # Tool implementations (>5 tools)
    ├── requirements.txt
    ├── .env.example
    └── README.md
```

## Implementation Rules

### 1. Dependencies

**Required:**
```txt
fastmcp>=0.5.8
python-dotenv==1.0.1
```

**Optional (only if needed):**
```txt
httpx==0.27.2         # For API calls
pydantic==2.10.3      # For complex validation
anthropic==0.40.0     # For Claude integration
```

**Avoid:**
- Logging libraries (colorlog, loguru)
- JSON alternatives (orjson, ujson)
- Monitoring (sentry-sdk)
- Extra utilities unless essential

### 2. Configuration

Keep configuration inline in `server.py`:

```python
CONFIG = {
    'api_key': os.getenv('API_KEY'),
    'timeout': int(os.getenv('TIMEOUT', '30'))
}
```

### 3. Code Organization

**DO:**
- Keep all code in `server.py` for <500 lines
- Use simple functions instead of classes
- Inline helper functions
- Use FastMCP's built-in features

**DON'T:**
- Create separate utils/helpers files
- Make complex class hierarchies
- Split into multiple directories
- Over-abstract simple logic

### 4. Error Handling

Simple and direct:
```python
@mcp.tool()
async def my_tool(param: str) -> dict:
    try:
        # Implementation
        return {"status": "success", "data": result}
    except Exception as e:
        return {"status": "error", "error": str(e)}
```

### 5. Logging

Use print() for debugging, no custom loggers:
```python
if CONFIG['debug']:
    print(f"Debug: Processing {data}")
```

## When to Split Files

Only split `server.py` when:
1. File exceeds 500 lines
2. You have 5+ complex tools
3. Significant shared business logic exists

When splitting, use maximum 2 files:
- `server.py`: FastMCP setup and simple tools
- `tools.py`: Complex tool implementations

## Example Implementation

See `/mcp-servers/template-mcp/` for a complete example following these standards.

## Checklist for New Servers

- [ ] Single `server.py` file (or max 2 files)
- [ ] Under 5 dependencies in requirements.txt
- [ ] No subdirectories (no src/, utils/, etc.)
- [ ] Configuration inline in server.py
- [ ] Simple error handling with try/except
- [ ] No custom logging setup
- [ ] Clear tool docstrings
- [ ] Brief README with examples
- [ ] .env.example with all variables

## Migration Guide

To migrate existing complex servers:

1. **Consolidate files**: Merge related code into server.py
2. **Remove directories**: Flatten src/, utils/, tools/ into root
3. **Simplify config**: Replace config classes with simple dict
4. **Reduce dependencies**: Remove non-essential packages
5. **Inline helpers**: Move utility functions into server.py
6. **Simplify logging**: Replace with print() or remove

## Benefits

- **Faster Development**: Less boilerplate, quicker to start
- **Easier Maintenance**: Everything in one place
- **Better Consistency**: All servers follow same pattern
- **Lower Complexity**: Fewer files to navigate
- **Reduced Dependencies**: Faster installs, fewer conflicts