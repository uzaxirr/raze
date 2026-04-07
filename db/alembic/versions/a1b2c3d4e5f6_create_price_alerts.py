"""create price_alerts

Revision ID: a1b2c3d4e5f6
Revises: c5ffd17fe67b
Create Date: 2025-12-27 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'c5ffd17fe67b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('price_alerts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.BigInteger(), nullable=False),
        sa.Column('token_address', sa.String(length=64), nullable=False),
        sa.Column('token_symbol', sa.String(length=32), nullable=True),
        sa.Column('target_price', sa.Numeric(precision=24, scale=12), nullable=False),
        sa.Column('condition', sa.String(length=10), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=True),
        sa.Column('triggered_at', sa.DateTime(), nullable=True),
        sa.Column('triggered_price', sa.Numeric(precision=24, scale=12), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user_profiles.telegram_user_id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_price_alerts_user_id'), 'price_alerts', ['user_id'], unique=False)
    op.create_index(op.f('ix_price_alerts_token_address'), 'price_alerts', ['token_address'], unique=False)
    op.create_index(op.f('ix_price_alerts_is_active'), 'price_alerts', ['is_active'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_price_alerts_is_active'), table_name='price_alerts')
    op.drop_index(op.f('ix_price_alerts_token_address'), table_name='price_alerts')
    op.drop_index(op.f('ix_price_alerts_user_id'), table_name='price_alerts')
    op.drop_table('price_alerts')
