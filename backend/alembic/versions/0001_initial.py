"""Initial schema migration."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "roles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(50), unique=True, nullable=False),
        sa.Column("description", sa.String(255), nullable=True),
    )
    op.create_index("ix_roles_name", "roles", ["name"])

    op.create_table(
        "permissions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("role_id", sa.Integer(), sa.ForeignKey("roles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("module", sa.String(50), nullable=False),
        sa.Column("can_view", sa.Boolean(), default=False),
        sa.Column("can_edit", sa.Boolean(), default=False),
        sa.Column("can_delete", sa.Boolean(), default=False),
        sa.UniqueConstraint("role_id", "module", name="uq_role_module"),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(80), unique=True, nullable=False),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=True),
        sa.Column("is_verified", sa.Boolean(), default=False),
        sa.Column("is_active", sa.Boolean(), default=True),
        sa.Column("google_id", sa.String(255), unique=True, nullable=True),
        sa.Column("avatar_url", sa.String(512), nullable=True),
        sa.Column("role_id", sa.Integer(), sa.ForeignKey("roles.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_username", "users", ["username"])
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "otp_records",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("purpose", sa.String(50), default="verify"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_otp_records_email", "otp_records", ["email"])

    op.create_table(
        "personal_info",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), unique=True),
        sa.Column("full_name", sa.String(200), default=""),
        sa.Column("title", sa.String(200), default=""),
        sa.Column("tagline", sa.String(300), default=""),
        sa.Column("bio", sa.Text(), default=""),
        sa.Column("location", sa.String(200), default=""),
        sa.Column("email_public", sa.String(255), default=""),
        sa.Column("phone", sa.String(50), default=""),
        sa.Column("website", sa.String(512), default=""),
        sa.Column("github", sa.String(512), default=""),
        sa.Column("linkedin", sa.String(512), default=""),
        sa.Column("twitter", sa.String(512), default=""),
        sa.Column("avatar_url", sa.String(512), nullable=True),
        sa.Column("public_fields", sa.Text()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "education",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("institution", sa.String(255), nullable=False),
        sa.Column("degree", sa.String(255), nullable=False),
        sa.Column("field_of_study", sa.String(255), default=""),
        sa.Column("start_year", sa.Integer(), nullable=True),
        sa.Column("end_year", sa.Integer(), nullable=True),
        sa.Column("grade", sa.String(50), default=""),
        sa.Column("description", sa.Text(), default=""),
        sa.Column("sort_order", sa.Integer(), default=0),
        sa.Column("public_visible", sa.Boolean(), default=True),
    )

    op.create_table(
        "experience",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("company", sa.String(255), nullable=False),
        sa.Column("role", sa.String(255), nullable=False),
        sa.Column("location", sa.String(200), default=""),
        sa.Column("start_date", sa.String(50), default=""),
        sa.Column("end_date", sa.String(50), default=""),
        sa.Column("is_current", sa.Boolean(), default=False),
        sa.Column("description", sa.Text(), default=""),
        sa.Column("sort_order", sa.Integer(), default=0),
        sa.Column("public_visible", sa.Boolean(), default=True),
    )

    op.create_table(
        "skills",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("group", sa.String(100), default="General"),
        sa.Column("proficiency", sa.Float(), default=80.0),
        sa.Column("sort_order", sa.Integer(), default=0),
        sa.Column("public_visible", sa.Boolean(), default=True),
    )

    op.create_table(
        "projects",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), default=""),
        sa.Column("tech_stack", sa.String(512), default=""),
        sa.Column("project_url", sa.String(512), default=""),
        sa.Column("repo_url", sa.String(512), default=""),
        sa.Column("thumbnail_url", sa.String(512), nullable=True),
        sa.Column("sort_order", sa.Integer(), default=0),
        sa.Column("public_visible", sa.Boolean(), default=True),
    )

    op.create_table(
        "cv_files",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("storage_path", sa.String(512), nullable=False),
        sa.Column("url", sa.String(512), nullable=False),
        sa.Column("is_current", sa.Boolean(), default=True),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "posts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("author_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("image_url", sa.String(512), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "post_likes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("post_id", sa.Integer(), sa.ForeignKey("posts.id", ondelete="CASCADE")),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("post_id", "user_id", name="uq_post_like"),
    )

    op.create_table(
        "post_comments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("post_id", sa.Integer(), sa.ForeignKey("posts.id", ondelete="CASCADE")),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE")),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    for table in [
        "post_comments",
        "post_likes",
        "posts",
        "cv_files",
        "projects",
        "skills",
        "experience",
        "education",
        "personal_info",
        "otp_records",
        "users",
        "permissions",
        "roles",
    ]:
        op.drop_table(table)
