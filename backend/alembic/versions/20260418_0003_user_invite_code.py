"""add user invite code

Revision ID: 20260418_0003
Revises: 20260418_0002
Create Date: 2026-04-18 22:00:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260418_0003"
down_revision: str | None = "20260418_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("invite_code", sa.String(length=50), nullable=True))
    op.create_index(op.f("ix_users_invite_code"), "users", ["invite_code"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_users_invite_code"), table_name="users")
    op.drop_column("users", "invite_code")
