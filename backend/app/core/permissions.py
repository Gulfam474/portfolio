"""RBAC dependency helpers for FastAPI routes."""

from __future__ import annotations

from typing import Annotated, Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db import get_db
from app.core.security import decode_token
from app.models.role import Permission, Role
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Resolve the authenticated user from a Bearer access token."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type",
            )
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    result = await db.execute(
        select(User)
        .options(selectinload(User.role).selectinload(Role.permissions))
        .where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
        )
    return user


async def get_optional_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(bearer_scheme)
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User | None:
    """Return the current user if authenticated, otherwise None."""
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None


def require_permission(module: str, action: str) -> Callable:
    """
    FastAPI dependency factory that enforces RBAC.

    action must be one of: view, edit, delete
    """

    async def _dependency(
        user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        if user.role is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No role assigned",
            )
        if user.role.name == "owner":
            return user

        perm: Permission | None = next(
            (p for p in user.role.permissions if p.module == module),
            None,
        )
        if perm is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"No permission for module '{module}'",
            )

        allowed = {
            "view": perm.can_view,
            "edit": perm.can_edit,
            "delete": perm.can_delete,
        }.get(action, False)

        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing {action} permission on '{module}'",
            )
        return user

    return _dependency


def build_permissions_map(user: User) -> dict[str, dict[str, bool]]:
    """Build module -> {can_view, can_edit, can_delete} for the frontend."""
    modules = ["profile", "cv", "posts", "admin"]
    if user.role and user.role.name == "owner":
        return {
            m: {"can_view": True, "can_edit": True, "can_delete": True}
            for m in modules
        }

    result: dict[str, dict[str, bool]] = {
        m: {"can_view": False, "can_edit": False, "can_delete": False}
        for m in modules
    }
    if user.role:
        for perm in user.role.permissions:
            result[perm.module] = {
                "can_view": perm.can_view,
                "can_edit": perm.can_edit,
                "can_delete": perm.can_delete,
            }
    return result
