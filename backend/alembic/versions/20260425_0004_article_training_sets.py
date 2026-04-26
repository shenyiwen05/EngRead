"""add article training sets

Revision ID: 20260425_0004
Revises: 20260418_0003
Create Date: 2026-04-25 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "20260425_0004"
down_revision = "20260418_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "article_training_sets",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("article_id", sa.String(length=36), nullable=False),
        sa.Column("owner_id", sa.String(length=36), nullable=False),
        sa.Column("exam_profile", sa.String(length=50), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["article_id"], ["articles.id"]),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("article_id", "exam_profile", "owner_id", name="uq_article_training_profile_owner"),
    )
    op.create_index(op.f("ix_article_training_sets_article_id"), "article_training_sets", ["article_id"], unique=False)
    op.create_index(op.f("ix_article_training_sets_owner_id"), "article_training_sets", ["owner_id"], unique=False)
    op.create_index(op.f("ix_article_training_sets_exam_profile"), "article_training_sets", ["exam_profile"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_article_training_sets_exam_profile"), table_name="article_training_sets")
    op.drop_index(op.f("ix_article_training_sets_owner_id"), table_name="article_training_sets")
    op.drop_index(op.f("ix_article_training_sets_article_id"), table_name="article_training_sets")
    op.drop_table("article_training_sets")
