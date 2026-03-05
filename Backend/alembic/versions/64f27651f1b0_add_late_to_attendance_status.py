"""add late to attendance status

Revision ID: 64f27651f1b0
Revises: 2a615b0b9a09
Create Date: 2026-03-04 12:49:15.129024

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '64f27651f1b0'
down_revision: Union[str, None] = '2a615b0b9a09'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TYPE attendancestatus ADD VALUE IF NOT EXISTS 'late'")
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
