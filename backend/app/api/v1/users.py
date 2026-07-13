"""User listing helpers (admin-facing endpoints live in admin.py)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db import get_db
from app.core.permissions import require_permission
from app.models.role import Role
from app.models.user import User
from app.schemas.auth import UserResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[UserResponse])
async def list_users(
    _: Annotated[User, Depends(require_permission("admin", "view"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[User]:
    """List all registered users (admin view)."""
    result = await db.execute(
        select(User).options(selectinload(User.role)).order_by(User.id)
    )
    return list(result.scalars().all())
