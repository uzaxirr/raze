"""Database connection and session management."""
import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load from project root
_root = Path(__file__).resolve().parent
while not (_root / '.env').exists() and _root != _root.parent:
    _root = _root.parent
load_dotenv(_root / '.env')

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://localhost:5432/razedb")
# Ensure DATABASE_URL uses psycopg driver for SQLAlchemy (Railway provides postgresql://)
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,      # Check connection before using
    pool_recycle=300,        # Recycle connections every 5 min
    pool_size=5,             # Max connections in pool
    max_overflow=10,         # Extra connections allowed
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency for getting database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
