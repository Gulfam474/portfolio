"""Profile-related ORM models: personal info, education, experience, skills, projects."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base

if TYPE_CHECKING:
    from app.models.user import User


class PersonalInfo(Base):
    """Site-owner personal information for the public CV overview."""

    __tablename__ = "personal_info"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True
    )
    full_name: Mapped[str] = mapped_column(String(200), default="")
    title: Mapped[str] = mapped_column(String(200), default="")
    tagline: Mapped[str] = mapped_column(String(300), default="")
    bio: Mapped[str] = mapped_column(Text, default="")
    location: Mapped[str] = mapped_column(String(200), default="")
    email_public: Mapped[str] = mapped_column(String(255), default="")
    phone: Mapped[str] = mapped_column(String(50), default="")
    website: Mapped[str] = mapped_column(String(512), default="")
    github: Mapped[str] = mapped_column(String(512), default="")
    linkedin: Mapped[str] = mapped_column(String(512), default="")
    twitter: Mapped[str] = mapped_column(String(512), default="")
    avatar_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    # public_visible flags as JSON-ish comma list of field names that are public
    public_fields: Mapped[str] = mapped_column(
        Text,
        default="full_name,title,tagline,bio,location,website,github,linkedin,twitter,avatar_url",
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="personal_info")


class Education(Base):
    """Education history entry."""

    __tablename__ = "education"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    institution: Mapped[str] = mapped_column(String(255))
    degree: Mapped[str] = mapped_column(String(255))
    field_of_study: Mapped[str] = mapped_column(String(255), default="")
    start_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    end_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    grade: Mapped[str] = mapped_column(String(50), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    public_visible: Mapped[bool] = mapped_column(Boolean, default=True)

    user: Mapped["User"] = relationship(back_populates="education")


class Experience(Base):
    """Work experience entry."""

    __tablename__ = "experience"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    company: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(255))
    location: Mapped[str] = mapped_column(String(200), default="")
    start_date: Mapped[str] = mapped_column(String(50), default="")
    end_date: Mapped[str] = mapped_column(String(50), default="")
    is_current: Mapped[bool] = mapped_column(Boolean, default=False)
    description: Mapped[str] = mapped_column(Text, default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    public_visible: Mapped[bool] = mapped_column(Boolean, default=True)

    user: Mapped["User"] = relationship(back_populates="experience")


class Skill(Base):
    """Skill with optional proficiency and group."""

    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(100))
    group: Mapped[str] = mapped_column(String(100), default="General")
    proficiency: Mapped[float] = mapped_column(Float, default=80.0)  # 0-100
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    public_visible: Mapped[bool] = mapped_column(Boolean, default=True)

    user: Mapped["User"] = relationship(back_populates="skills")


class Project(Base):
    """Portfolio project entry."""

    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text, default="")
    tech_stack: Mapped[str] = mapped_column(String(512), default="")  # comma-separated
    project_url: Mapped[str] = mapped_column(String(512), default="")
    repo_url: Mapped[str] = mapped_column(String(512), default="")
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    public_visible: Mapped[bool] = mapped_column(Boolean, default=True)

    user: Mapped["User"] = relationship(back_populates="projects")


class Certificate(Base):
    """Certification or course credential."""

    __tablename__ = "certificates"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(255))
    issuer: Mapped[str] = mapped_column(String(255), default="")
    year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    credential_url: Mapped[str] = mapped_column(String(512), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    public_visible: Mapped[bool] = mapped_column(Boolean, default=True)

    user: Mapped["User"] = relationship(back_populates="certificates")
