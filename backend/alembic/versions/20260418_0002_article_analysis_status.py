"""add article analysis status

Revision ID: 20260418_0002
Revises: 20260418_0001
Create Date: 2026-04-18
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260418_0002"
down_revision: Union[str, Sequence[str], None] = "20260418_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "articles",
        sa.Column("analysis_status", sa.String(length=50), nullable=False, server_default="ready"),
    )
    op.add_column("articles", sa.Column("analysis_error_message", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("articles", "analysis_error_message")
    op.drop_column("articles", "analysis_status")
