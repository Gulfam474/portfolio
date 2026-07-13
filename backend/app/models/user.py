"""User ORM model."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base

if TYPE_CHECKING:
    from app.models.cv import CVFile
    from app.models.post import Post
    from app.models.profile import (
        Certificate,
        Education,
        Experience,
        PersonalInfo,
        Project,
        Skill,
    )
    from app.models.role import Role


class User(Base):
    """Authenticated account with role-based access."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    google_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True, unique=True
    )
    avatar_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    role_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("roles.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    role: Mapped[Optional["Role"]] = relationship(back_populates="users")
    personal_info: Mapped[Optional["PersonalInfo"]] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    education: Mapped[List["Education"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    experience: Mapped[List["Experience"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    skills: Mapped[List["Skill"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    projects: Mapped[List["Project"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    certificates: Mapped[List["Certificate"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    cv_files: Mapped[List["CVFile"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    posts: Mapped[List["Post"]] = relationship(
        back_populates="author", cascade="all, delete-orphan"
    )
