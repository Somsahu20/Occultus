"""Add version column to the vault table

Revision ID: 6a18a4f69b74
Revises: c2308d02813e
Create Date: 2026-01-19 00:26:17.736300

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6a18a4f69b74'
down_revision: Union[str, Sequence[str], None] = 'c2308d02813e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("vaults", sa.Column("version", sa.BigInteger, nullable=False, default=1))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("vaults", "version")
