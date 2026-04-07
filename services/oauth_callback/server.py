"""OAuth Callback Service for BYOMCP OAuth 2.1 flows."""
import os
import logging
import secrets
import hashlib
import base64
from datetime import datetime, timedelta, timezone
from typing import Optional
from urllib.parse import urlencode

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import models (adjust path as needed when deployed)
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
from db.models import Base, MCPOAuthPending, UserMCPServer, UserProfile

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://localhost:5432/razedb")
# Ensure DATABASE_URL uses psycopg driver for SQLAlchemy
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CALLBACK_BASE_URL = os.getenv("CALLBACK_BASE_URL", "https://oauth-callback-production.up.railway.app")

# Database setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI(title="MCP OAuth Callback Service")


# =============================================================================
# PKCE Utilities
# =============================================================================

def generate_code_verifier() -> str:
    """Generate a cryptographically random code verifier for PKCE."""
    return secrets.token_urlsafe(64)[:128]


def generate_code_challenge(verifier: str) -> str:
    """Generate code challenge from verifier using S256 method."""
    digest = hashlib.sha256(verifier.encode()).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode()


def generate_state() -> str:
    """Generate a cryptographically random state parameter."""
    return secrets.token_urlsafe(32)


# =============================================================================
# OAuth Authorization URL Builder
# =============================================================================

def build_authorization_url(
    authorization_endpoint: str,
    client_id: str,
    redirect_uri: str,
    state: str,
    code_challenge: str,
    scope: str = "mcp"
) -> str:
    """Build OAuth 2.1 authorization URL with PKCE."""
    params = {
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
        "scope": scope,
    }
    return f"{authorization_endpoint}?{urlencode(params)}"


# =============================================================================
# Telegram Notification
# =============================================================================

async def send_telegram_notification(user_id: int, message: str):
    """Send a notification to user via Telegram bot."""
    if not TELEGRAM_BOT_TOKEN:
        logger.warning("TELEGRAM_BOT_TOKEN not set, skipping notification")
        return

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json={
                "chat_id": user_id,
                "text": message,
                "parse_mode": "HTML"
            })
            response.raise_for_status()
            logger.info(f"Sent Telegram notification to user {user_id}")
        except Exception as e:
            logger.error(f"Failed to send Telegram notification: {e}")


# =============================================================================
# API Endpoints
# =============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "mcp-oauth-callback"}


@app.get("/oauth/callback")
async def oauth_callback(
    code: str = Query(..., description="Authorization code from OAuth server"),
    state: str = Query(..., description="State parameter for CSRF protection"),
    error: Optional[str] = Query(None, description="Error from OAuth server"),
    error_description: Optional[str] = Query(None, description="Error description")
):
    """
    Handle OAuth callback from MCP servers.

    Flow:
    1. Validate state against pending OAuth flows
    2. Exchange authorization code for tokens using PKCE
    3. Store tokens in user_mcp_servers table
    4. Notify user via Telegram
    5. Redirect to success page
    """
    # Handle OAuth errors
    if error:
        logger.error(f"OAuth error: {error} - {error_description}")
        return HTMLResponse(
            content=f"""
            <html>
            <head><title>Authorization Failed</title></head>
            <body style="font-family: system-ui; padding: 40px; text-align: center;">
                <h1>Authorization Failed</h1>
                <p>{error_description or error}</p>
                <p>You can close this window and try again in Telegram.</p>
            </body>
            </html>
            """,
            status_code=400
        )

    db = SessionLocal()
    try:
        # 1. Validate state and find pending OAuth flow
        pending = db.query(MCPOAuthPending).filter(
            MCPOAuthPending.state == state
        ).first()

        if not pending:
            logger.warning(f"Invalid or expired state: {state[:8]}...")
            return HTMLResponse(
                content="""
                <html>
                <head><title>Invalid Request</title></head>
                <body style="font-family: system-ui; padding: 40px; text-align: center;">
                    <h1>Invalid or Expired Link</h1>
                    <p>This authorization link has expired or is invalid.</p>
                    <p>Please try connecting the MCP server again in Telegram.</p>
                </body>
                </html>
                """,
                status_code=400
            )

        # Check expiry
        if datetime.now(timezone.utc) > pending.expires_at.replace(tzinfo=timezone.utc):
            logger.warning(f"Expired OAuth flow for state: {state[:8]}...")
            db.delete(pending)
            db.commit()
            return HTMLResponse(
                content="""
                <html>
                <head><title>Link Expired</title></head>
                <body style="font-family: system-ui; padding: 40px; text-align: center;">
                    <h1>Authorization Link Expired</h1>
                    <p>This link has expired. Please try again in Telegram.</p>
                </body>
                </html>
                """,
                status_code=400
            )

        # 2. Exchange code for tokens
        token_data = await exchange_code_for_tokens(
            token_endpoint=pending.token_endpoint,
            code=code,
            code_verifier=pending.code_verifier,
            redirect_uri=f"{CALLBACK_BASE_URL}/oauth/callback",
            client_id=pending.client_id
        )

        if not token_data:
            logger.error("Failed to exchange code for tokens")
            return HTMLResponse(
                content="""
                <html>
                <head><title>Token Exchange Failed</title></head>
                <body style="font-family: system-ui; padding: 40px; text-align: center;">
                    <h1>Authorization Failed</h1>
                    <p>Failed to complete authorization. Please try again.</p>
                </body>
                </html>
                """,
                status_code=500
            )

        # 3. Create or update UserMCPServer with OAuth tokens
        existing_server = db.query(UserMCPServer).filter(
            UserMCPServer.user_id == pending.user_id,
            UserMCPServer.name == pending.mcp_server_name
        ).first()

        if existing_server:
            # Update existing server with OAuth tokens
            existing_server.auth_type = "oauth"
            existing_server.access_token = token_data.get("access_token")
            existing_server.refresh_token = token_data.get("refresh_token")
            if token_data.get("expires_in"):
                existing_server.token_expires_at = datetime.now(timezone.utc) + timedelta(
                    seconds=token_data["expires_in"]
                )
            existing_server.is_active = True
        else:
            # Create new server entry
            new_server = UserMCPServer(
                user_id=pending.user_id,
                name=pending.mcp_server_name,
                url=pending.mcp_server_url,
                transport="streamable-http",
                auth_type="oauth",
                access_token=token_data.get("access_token"),
                refresh_token=token_data.get("refresh_token"),
                is_active=True
            )
            if token_data.get("expires_in"):
                new_server.token_expires_at = datetime.now(timezone.utc) + timedelta(
                    seconds=token_data["expires_in"]
                )
            db.add(new_server)

        # Clean up pending OAuth flow
        db.delete(pending)
        db.commit()

        # 4. Notify user via Telegram
        await send_telegram_notification(
            pending.user_id,
            f"connected to {pending.mcp_server_name}! you can now use its tools"
        )

        # 5. Redirect to success page
        return RedirectResponse(url="/oauth/success")

    except Exception as e:
        logger.exception(f"Error in OAuth callback: {e}")
        db.rollback()
        return HTMLResponse(
            content="""
            <html>
            <head><title>Error</title></head>
            <body style="font-family: system-ui; padding: 40px; text-align: center;">
                <h1>Something Went Wrong</h1>
                <p>An unexpected error occurred. Please try again.</p>
            </body>
            </html>
            """,
            status_code=500
        )
    finally:
        db.close()


async def exchange_code_for_tokens(
    token_endpoint: str,
    code: str,
    code_verifier: str,
    redirect_uri: str,
    client_id: Optional[str] = None
) -> Optional[dict]:
    """Exchange authorization code for access/refresh tokens using PKCE."""
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "code_verifier": code_verifier,
        "redirect_uri": redirect_uri,
    }
    if client_id:
        data["client_id"] = client_id

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                token_endpoint,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Token exchange failed: {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"Token exchange error: {e}")
            return None


@app.get("/oauth/success")
async def oauth_success():
    """Success page shown after successful OAuth flow."""
    return HTMLResponse(
        content="""
        <html>
        <head>
            <title>Connected!</title>
            <style>
                body {
                    font-family: system-ui, -apple-system, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                }
                .card {
                    background: white;
                    padding: 40px 60px;
                    border-radius: 16px;
                    text-align: center;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }
                .checkmark {
                    font-size: 64px;
                    margin-bottom: 20px;
                }
                h1 {
                    color: #333;
                    margin: 0 0 10px 0;
                }
                p {
                    color: #666;
                    margin: 0;
                }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="checkmark">&#10003;</div>
                <h1>Connected!</h1>
                <p>You can close this window and return to Telegram.</p>
            </div>
        </body>
        </html>
        """
    )


# =============================================================================
# Token Refresh Utility (can be called from main agent)
# =============================================================================

async def refresh_oauth_token(
    token_endpoint: str,
    refresh_token: str,
    client_id: Optional[str] = None
) -> Optional[dict]:
    """Refresh an expired access token using the refresh token."""
    data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
    }
    if client_id:
        data["client_id"] = client_id

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                token_endpoint,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Token refresh failed: {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"Token refresh error: {e}")
            return None


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
