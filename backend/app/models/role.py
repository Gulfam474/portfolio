"""Role and permission ORM models."""

from __future__ import annotations

from typing import TYPE_CHECKING, List

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base

if TYPE_CHECKING:
    from app.models.user import User


class Role(Base):
    """Named role such as owner, admin, editor, viewer, guest."""

    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)

    permissions: Mapped[List["Permission"]] = relationship(
        back_populates="role",
        cascade="all, delete-orphan",
    )
    users: Mapped[List["User"]] = relationship(back_populates="role")


class Permission(Base):
    """Per-module capabilities assigned to a role."""

    __tablename__ = "permissions"
    __table_args__ = (UniqueConstraint("role_id", "module", name="uq_role_module"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id", ondelete="CASCADE"))
    module: Mapped[str] = mapped_column(String(50))
    can_view: Mapped[bool] = mapped_column(Boolean, default=False)
    can_edit: Mapped[bool] = mapped_column(Boolean, default=False)
    can_delete: Mapped[bool] = mapped_column(Boolean, default=False)

    role: Mapped["Role"] = relationship(back_populates="permissions")
