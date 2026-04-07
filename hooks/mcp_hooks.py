"""
MCP hooks for BYOMCP (Bring Your Own MCP) functionality.
These hooks inject/cleanup user's custom MCP servers for each agent run.
"""
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta, timezone
import httpx
from agno.agent import Agent
from agno.tools.mcp import MCPTools, SSEClientParams, StreamableHTTPClientParams
from db.database import SessionLocal
from db.models import UserMCPServer

logger = logging.getLogger(__name__)


async def _refresh_oauth_token(server: UserMCPServer, db) -> Optional[str]:
    """
    Refresh an expired OAuth access token using the refresh token.
    Updates the database with new tokens.

    Returns the new access_token if successful, None otherwise.
    """
    if not server.refresh_token:
        logger.warning(f"No refresh token for server '{server.name}'")
        return None

    # We need to get the token endpoint from the OAuth metadata
    # For now, we'll try the standard token endpoint path
    from urllib.parse import urlparse, urljoin
    parsed = urlparse(server.url)
    base_url = f"{parsed.scheme}://{parsed.netloc}"

    # Try to discover token endpoint from OAuth metadata
    well_known_url = urljoin(base_url, "/.well-known/oauth-authorization-server")

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            # Get OAuth metadata
            metadata_response = await client.get(well_known_url)
            if metadata_response.status_code != 200:
                logger.warning(f"Could not fetch OAuth metadata for token refresh")
                return None

            metadata = metadata_response.json()
            token_endpoint = metadata.get("token_endpoint")

            if not token_endpoint:
                logger.warning(f"No token_endpoint in OAuth metadata")
                return None

            # Refresh the token
            refresh_data = {
                "grant_type": "refresh_token",
                "refresh_token": server.refresh_token,
            }

            response = await client.post(
                token_endpoint,
                data=refresh_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )

            if response.status_code != 200:
                logger.error(f"Token refresh failed: {response.status_code}")
                return None

            token_data = response.json()
            new_access_token = token_data.get("access_token")
            new_refresh_token = token_data.get("refresh_token")
            expires_in = token_data.get("expires_in")

            if not new_access_token:
                logger.error("No access_token in refresh response")
                return None

            # Update database
            server.access_token = new_access_token
            if new_refresh_token:
                server.refresh_token = new_refresh_token
            if expires_in:
                server.token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

            db.commit()
            logger.info(f"Refreshed OAuth token for server '{server.name}'")

            return new_access_token

        except Exception as e:
            logger.error(f"Error refreshing OAuth token: {e}")
            return None


async def inject_user_mcp_tools(
    agent: Agent,
    session_state: Optional[Dict[str, Any]] = None,
    metadata: Optional[Dict[str, Any]] = None,
    **kwargs
):
    """
    Pre-hook: Connect and add user's custom MCP servers to the agent.
    Tools from user's MCP servers will be available for the current run only.
    Handles OAuth token refresh for expired tokens.
    """
    if not session_state:
        return

    telegram_user_id = session_state.get("telegram_user_id")
    if not telegram_user_id:
        logger.debug("No telegram_user_id in session_state, skipping MCP injection")
        return

    db = SessionLocal()
    try:
        # Query user's active MCP servers
        servers = db.query(UserMCPServer).filter(
            UserMCPServer.user_id == telegram_user_id,
            UserMCPServer.is_active == True
        ).all()

        if not servers:
            logger.debug(f"No MCP servers for user {telegram_user_id}")
            return

        logger.info(f"Injecting {len(servers)} MCP server(s) for user {telegram_user_id}")

        mcp_connections: List[MCPTools] = []
        for server in servers:
            try:
                # Build headers dict based on auth type
                headers = None

                if server.auth_type == "api_key" and server.api_key:
                    # API key authentication
                    headers = {"Authorization": f"Bearer {server.api_key}"}

                elif server.auth_type == "oauth" and server.access_token:
                    # OAuth authentication - check if token needs refresh
                    access_token = server.access_token

                    if server.token_expires_at:
                        # Check if token is expired or about to expire (5 min buffer)
                        expires_at = server.token_expires_at
                        if expires_at.tzinfo is None:
                            expires_at = expires_at.replace(tzinfo=timezone.utc)

                        if datetime.now(timezone.utc) >= expires_at - timedelta(minutes=5):
                            logger.info(f"OAuth token expired for '{server.name}', refreshing...")
                            new_token = await _refresh_oauth_token(server, db)
                            if new_token:
                                access_token = new_token
                            else:
                                logger.warning(f"Failed to refresh token for '{server.name}', skipping")
                                continue

                    headers = {"Authorization": f"Bearer {access_token}"}

                elif server.api_key:
                    # Fallback for servers with api_key but no auth_type set
                    headers = {"Authorization": f"Bearer {server.api_key}"}

                # Create MCPTools with tool_name_prefix to avoid collisions
                # Use server_params to pass headers based on transport type
                if headers:
                    if server.transport == "sse":
                        server_params = SSEClientParams(
                            url=server.url,
                            headers=headers
                        )
                    else:  # streamable-http or default
                        server_params = StreamableHTTPClientParams(
                            url=server.url,
                            headers=headers
                        )
                    mcp_tools = MCPTools(
                        server_params=server_params,
                        transport=server.transport,
                        tool_name_prefix=f"{server.name}_"  # Prefix all tools with server name
                    )
                else:
                    mcp_tools = MCPTools(
                        transport=server.transport,
                        url=server.url,
                        tool_name_prefix=f"{server.name}_"  # Prefix all tools with server name
                    )
                # Connect to the MCP server
                await mcp_tools.connect()
                # Add tools to agent
                agent.add_tool(mcp_tools)
                mcp_connections.append(mcp_tools)
                logger.info(f"Connected user MCP server '{server.name}' ({server.url})")
            except Exception as e:
                logger.warning(f"Failed to connect to user MCP server '{server.name}': {e}")

        # Store connections in metadata for cleanup in post-hook
        if mcp_connections:
            if metadata is None:
                metadata = {}
            metadata["_user_mcp_connections"] = mcp_connections

    except Exception as e:
        logger.error(f"Error in inject_user_mcp_tools: {e}")
    finally:
        db.close()


async def cleanup_user_mcp_tools(
    agent: Agent,
    metadata: Optional[Dict[str, Any]] = None,
    **kwargs
):
    """
    Post-hook: Disconnect user's custom MCP servers to clean up resources.
    """
    if not metadata:
        return

    mcp_connections = metadata.get("_user_mcp_connections", [])
    if not mcp_connections:
        return

    logger.info(f"Cleaning up {len(mcp_connections)} user MCP connection(s)")

    for mcp_tools in mcp_connections:
        try:
            await mcp_tools.close()
        except Exception as e:
            logger.warning(f"Failed to disconnect MCP tools: {e}")
