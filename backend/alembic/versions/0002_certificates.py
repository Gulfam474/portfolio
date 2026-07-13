"""Add certificates table."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0002_certificates"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "certificates",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("issuer", sa.String(255), default=""),
        sa.Column("year", sa.Integer(), nullable=True),
        sa.Column("credential_url", sa.String(512), default=""),
        sa.Column("description", sa.Text(), default=""),
        sa.Column("sort_order", sa.Integer(), default=0),
        sa.Column("public_visible", sa.Boolean(), default=True),
    )


def downgrade() -> None:
    op.drop_table("certificates")
