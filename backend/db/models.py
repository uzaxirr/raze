"""SQLAlchemy models for the application."""
from sqlalchemy import Column, Integer, BigInteger, String, DateTime, Boolean, Numeric, Float, ForeignKey, UniqueConstraint, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func

Base = declarative_base()


class UserProfile(Base):
    """User profile table storing Telegram user data and wallet information."""
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True)
    telegram_user_id = Column(BigInteger, unique=True, nullable=False, index=True)
    telegram_username = Column(String(255))
    wallet_address = Column(String(64), index=True)
    wallet_id = Column(String(64))
    solana_network = Column(String(20), default="mainnet")  # mainnet or devnet
    signing_mode = Column(String(20), nullable=False, default="internal")  # internal or external
    external_wallet_address = Column(String(64), nullable=True, default=None)  # self-custody wallet address
    preferred_wallet_app = Column(String(20), nullable=False, default="phantom")  # phantom, backpack, solflare
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<UserProfile(telegram_user_id={self.telegram_user_id}, wallet={self.wallet_address})>"


class PriceAlert(Base):
    """Price alert configuration for notification triggers."""
    __tablename__ = "price_alerts"

    id = Column(Integer, primary_key=True)
    user_id = Column(BigInteger, ForeignKey('user_profiles.telegram_user_id'), nullable=False, index=True)
    token_address = Column(String(64), nullable=False, index=True)
    token_symbol = Column(String(32))  # Cached for display (e.g., "SOL", "BONK")
    target_price = Column(Numeric(24, 12), nullable=False)  # High precision for small tokens
    condition = Column(String(10), nullable=False)  # 'above' or 'below'
    is_active = Column(Boolean, default=True, index=True)
    triggered_at = Column(DateTime, nullable=True)
    triggered_price = Column(Numeric(24, 12), nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    # Relationship
    user = relationship("UserProfile", backref="price_alerts")

    def __repr__(self):
        return f"<PriceAlert(user={self.user_id}, {self.token_symbol} {self.condition} ${self.target_price})>"


class UserPreferences(Base):
    """User preferences for personalized agent behavior."""
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True)
    user_id = Column(BigInteger, ForeignKey('user_profiles.telegram_user_id'), unique=True, nullable=False, index=True)

    # Communication style
    tone = Column(String(20), default="casual")  # casual, professional, degen
    verbosity = Column(String(20), default="brief")  # brief, detailed, technical

    # Trading preferences
    risk_tolerance = Column(String(20), default="moderate")  # conservative, moderate, aggressive
    default_slippage = Column(Float, default=0.5)  # percentage
    favorite_tokens = Column(ARRAY(String), default=[])  # ["SOL", "BONK", "JUP"]

    # Notification preferences
    price_alert_style = Column(String(20), default="simple")  # simple, detailed, meme

    # Experience level
    experience_level = Column(String(20), default="intermediate")  # beginner, intermediate, expert

    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationship
    user = relationship("UserProfile", backref="preferences")

    def __repr__(self):
        return f"<UserPreferences(user={self.user_id}, tone={self.tone}, risk={self.risk_tolerance})>"


class WatchedToken(Base):
    """Watched tokens from sniper workflow for tracking."""
    __tablename__ = "watched_tokens"

    id = Column(Integer, primary_key=True)
    user_id = Column(BigInteger, ForeignKey('user_profiles.telegram_user_id'), nullable=False, index=True)
    token_address = Column(String(64), nullable=False, index=True)
    token_symbol = Column(String(32))
    token_name = Column(String(128))

    # Metrics at discovery time
    discovered_at = Column(DateTime, server_default=func.now())
    discovered_price = Column(Numeric(24, 12))
    discovered_mc = Column(Numeric(24, 2))
    momentum_score = Column(Integer)

    # Status
    status = Column(String(20), default="watching")  # watching, bought, sold, removed
    notes = Column(String(512))  # User notes

    # Timestamps
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationship
    user = relationship("UserProfile", backref="watched_tokens")

    def __repr__(self):
        return f"<WatchedToken(user={self.user_id}, {self.token_symbol} score={self.momentum_score})>"


class WalletAlert(Base):
    """Wallet activity alerts for transaction notifications."""
    __tablename__ = "wallet_alerts"

    id = Column(Integer, primary_key=True)
    user_id = Column(BigInteger, ForeignKey('user_profiles.telegram_user_id'), nullable=False, index=True)
    watched_wallet = Column(String(64), nullable=False, index=True)
    wallet_label = Column(String(64))  # Optional nickname (e.g., "whale", "vitalik")
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, server_default=func.now())

    # Relationship
    user = relationship("UserProfile", backref="wallet_alerts")

    def __repr__(self):
        return f"<WalletAlert(user={self.user_id}, wallet={self.watched_wallet[:8]}...)>"


class HeliusWebhookConfig(Base):
    """Store master Helius webhook configuration."""
    __tablename__ = "helius_webhook_config"

    id = Column(Integer, primary_key=True)
    webhook_id = Column(String(128), nullable=False)
    webhook_url = Column(String(512), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    def __repr__(self):
        return f"<HeliusWebhookConfig(id={self.webhook_id[:8]}...)>"


class UserMCPServer(Base):
    """User's custom MCP server configurations for BYOMCP feature."""
    __tablename__ = "user_mcp_servers"

    id = Column(Integer, primary_key=True)
    user_id = Column(BigInteger, ForeignKey('user_profiles.telegram_user_id'), nullable=False, index=True)
    name = Column(String(64), nullable=False)  # User-friendly name e.g., "my-github-server"
    url = Column(String(512), nullable=False)  # MCP server URL e.g., "https://my-server.com/mcp"
    transport = Column(String(20), default="streamable-http")  # sse or streamable-http
    api_key = Column(String(512), nullable=True)  # Optional API key for authenticated MCP servers
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, server_default=func.now())

    # OAuth 2.1 authentication fields
    auth_type = Column(String(20), default="none")  # none, api_key, oauth
    access_token = Column(Text, nullable=True)  # OAuth access token (encrypted)
    refresh_token = Column(Text, nullable=True)  # OAuth refresh token (encrypted)
    token_expires_at = Column(DateTime, nullable=True)  # When access token expires

    # Relationship
    user = relationship("UserProfile", backref="mcp_servers")

    __table_args__ = (
        UniqueConstraint('user_id', 'name', name='unique_user_mcp_name'),
    )

    def __repr__(self):
        return f"<UserMCPServer(user={self.user_id}, name={self.name}, url={self.url[:30]}...)>"


class MCPOAuthPending(Base):
    """Pending OAuth flows for MCP server authentication."""
    __tablename__ = "mcp_oauth_pending"

    id = Column(Integer, primary_key=True)
    user_id = Column(BigInteger, ForeignKey('user_profiles.telegram_user_id'), nullable=False, index=True)
    state = Column(String(64), unique=True, nullable=False, index=True)  # CSRF protection
    mcp_server_name = Column(String(64), nullable=False)
    mcp_server_url = Column(String(512), nullable=False)
    code_verifier = Column(String(128), nullable=False)  # PKCE code verifier
    authorization_endpoint = Column(String(512), nullable=False)  # OAuth authorization URL
    token_endpoint = Column(String(512), nullable=False)  # OAuth token URL
    client_id = Column(String(256), nullable=True)  # Dynamic client ID if registered
    created_at = Column(DateTime, server_default=func.now())
    expires_at = Column(DateTime, nullable=False)  # 10 min expiry

    # Relationship
    user = relationship("UserProfile", backref="pending_oauth")

    def __repr__(self):
        return f"<MCPOAuthPending(user={self.user_id}, server={self.mcp_server_name}, state={self.state[:8]}...)>"


class Waitlist(Base):
    """Waitlist table for gated beta access with referral system."""
    __tablename__ = "waitlist"

    id = Column(Integer, primary_key=True)
    telegram_user_id = Column(BigInteger, unique=True, nullable=False, index=True)
    telegram_username = Column(String(64))
    first_name = Column(String(128))
    email = Column(String(256))
    referral_code = Column(String(8), unique=True, nullable=False, index=True)
    referred_by_code = Column(String(8))
    referred_by_user_id = Column(BigInteger)
    position = Column(Integer, nullable=False)
    referral_count = Column(Integer, default=0)
    status = Column(String(20), default="waiting", index=True)  # waiting | approved | active | banned
    messages_today = Column(Integer, default=0)
    messages_reset_at = Column(DateTime, server_default=func.now())
    daily_alpha_enabled = Column(Boolean, default=True)
    wallet_address_shared = Column(String(64))
    bouncer_score = Column(Integer)  # 1-10, set by bouncer agent
    remarks = Column(Text)  # JSON string — bouncer agent's notes on the user
    joined_via = Column(String(20), default="direct")  # direct | referral | website
    approved_at = Column(DateTime)
    activated_at = Column(DateTime)
    last_seen_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Waitlist(user={self.telegram_user_id}, pos={self.position}, status={self.status})>"


class SignSession(Base):
    """External transaction signing sessions (intent-based, no pre-built tx)."""
    __tablename__ = "sign_sessions"

    id = Column(String(36), primary_key=True)
    viewer_token_hash = Column(String(64), nullable=False)

    # Intent — what the user wants to do
    type = Column(String(20), nullable=False)  # swap | sol_transfer | token_transfer
    wallet_address = Column(String(64))
    from_token = Column(String(64))
    to_token = Column(String(64))
    amount = Column(Numeric(24, 12), nullable=False)
    to_address = Column(String(64))
    slippage_bps = Column(Integer, default=50)
    network = Column(String(20), default="mainnet")

    # Tracking
    reference_key = Column(String(64), nullable=False, index=True)
    telegram_chat_id = Column(BigInteger)
    execution_mode = Column(String(20))  # managed_execute | wallet_broadcast

    # Status
    status = Column(String(20), default="pending", index=True)
    tx_hash = Column(String(128))
    error_message = Column(Text)

    # Display metadata (populated after /build)
    from_symbol = Column(String(20))
    to_symbol = Column(String(20))
    output_amount = Column(Numeric(24, 12))
    price_impact = Column(String(64))
    fee_amount = Column(Numeric(24, 12))
    fee_bps = Column(Integer)

    # Timestamps
    created_at = Column(DateTime, server_default=func.now())
    expires_at = Column(DateTime, nullable=False)
    confirmed_at = Column(DateTime)

    def __repr__(self):
        return f"<SignSession(id={self.id[:8]}..., type={self.type}, status={self.status})>"


class SignSessionEvent(Base):
    """Audit trail for signing session state transitions."""
    __tablename__ = "sign_session_events"

    id = Column(Integer, primary_key=True)
    session_id = Column(String(36), ForeignKey("sign_sessions.id"), nullable=False, index=True)
    event = Column(String(50), nullable=False)
    data = Column(Text)  # JSON string
    created_at = Column(DateTime, server_default=func.now())


class Subscription(Base):
    """Raze Unleashed subscriptions — $5/month via crypto or Stripe."""
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True)

    # Identity — at least one must be set
    email = Column(String(256), index=True)
    telegram_user_id = Column(BigInteger, index=True, nullable=True)
    imessage_phone = Column(String(20), index=True, nullable=True)

    # Subscription state
    tier = Column(String(20), nullable=False, default="free")  # free | unleashed
    status = Column(String(20), nullable=False, default="active")  # active | cancelled | expired

    # Payment
    payment_method = Column(String(20))  # stripe | onchain_usdc
    stripe_customer_id = Column(String(64))
    stripe_subscription_id = Column(String(64))
    onchain_tx_hash = Column(String(128))  # last USDC payment tx

    # Billing cycle
    current_period_start = Column(DateTime)
    current_period_end = Column(DateTime)  # subscription expires after this

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Subscription(tg={self.telegram_user_id}, tier={self.tier}, expires={self.current_period_end})>"


class UserTrigger(Base):
    """User triggers powered by Elfa Auto — price alerts, recurring updates, and conditional execution."""
    __tablename__ = "user_triggers"

    id = Column(Integer, primary_key=True)
    telegram_user_id = Column(BigInteger, ForeignKey('user_profiles.telegram_user_id'), nullable=False, index=True)
    elfa_query_id = Column(String(255), unique=True, nullable=False, index=True)

    # Trigger classification
    trigger_type = Column(String(20), nullable=False)  # 'alert', 'auto_execute', 'recurring'
    description = Column(Text, nullable=False)  # Original user prompt

    # Action to take when trigger fires (for auto_execute)
    # e.g. {"action": "swap", "params": {"from": "USDC", "to": "SOL", "amount": 500}}
    action_config = Column(JSONB, nullable=True)

    # Full Elfa EQL query for debugging
    elfa_query_json = Column(JSONB, nullable=True)

    # Lifecycle
    status = Column(String(20), nullable=False, default='active', index=True)  # active, triggered, cancelled, expired, pending_retry
    created_at = Column(DateTime, server_default=func.now())
    triggered_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)  # 30 days from creation by default

    # Relationship
    user = relationship("UserProfile", backref="triggers")

    def __repr__(self):
        return f"<UserTrigger(user={self.telegram_user_id}, type={self.trigger_type}, status={self.status})>"
