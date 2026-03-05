"""add late threshold to events

Revision ID: 9f1c2ab8d4e7
Revises: 64f27651f1b0
Create Date: 2026-03-04 15:15:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9f1c2ab8d4e7"
down_revision: Union[str, None] = "64f27651f1b0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "events",
        sa.Column(
            "late_threshold_minutes",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )
    op.alter_column("events", "late_threshold_minutes", server_default=None)


def downgrade() -> None:
    op.drop_column("events", "late_threshold_minutes")
