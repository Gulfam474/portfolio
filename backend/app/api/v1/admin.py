"""Admin role and permission management."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db import get_db
from app.core.permissions import require_permission
from app.models.role import Permission, Role
from app.models.user import User
from app.schemas.role import (
    AssignRoleRequest,
    PermissionResponse,
    PermissionUpdate,
    RoleCreate,
    RoleResponse,
    RoleUpdate,
    UserAdminResponse,
)

router = APIRouter(prefix="/admin", tags=["admin"])

MODULES = ["profile", "cv", "posts", "admin"]


@router.get("/roles", response_model=list[RoleResponse])
async def list_roles(
    _: Annotated[User, Depends(require_permission("admin", "view"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(Role).options(selectinload(Role.permissions)).order_by(Role.id)
    )
    return list(result.scalars().all())


@router.post("/roles", response_model=RoleResponse, status_code=201)
async def create_role(
    body: RoleCreate,
    _: Annotated[User, Depends(require_permission("admin", "edit"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    existing = await db.execute(select(Role).where(Role.name == body.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, "Role already exists")
    role = Role(name=body.name, description=body.description)
    db.add(role)
    await db.flush()
    for module in MODULES:
        db.add(
            Permission(
                role_id=role.id,
                module=module,
                can_view=module != "admin",
                can_edit=False,
                can_delete=False,
            )
        )
    await db.flush()
    result = await db.execute(
        select(Role).options(selectinload(Role.permissions)).where(Role.id == role.id)
    )
    return result.scalar_one()


@router.put("/roles/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: int,
    body: RoleUpdate,
    _: Annotated[User, Depends(require_permission("admin", "edit"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(Role).options(selectinload(Role.permissions)).where(Role.id == role_id)
    )
    role = result.scalar_one_or_none()
    if role is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Role not found")
    if role.name == "owner":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot rename owner role")
    if body.name is not None:
        role.name = body.name
    if body.description is not None:
        role.description = body.description
    await db.flush()
    await db.refresh(role)
    return role


@router.delete("/roles/{role_id}", status_code=204)
async def delete_role(
    role_id: int,
    _: Annotated[User, Depends(require_permission("admin", "delete"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    if role is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Role not found")
    if role.name in {"owner", "guest"}:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot delete system roles")
    await db.delete(role)


@router.get("/roles/{role_id}/permissions", response_model=list[PermissionResponse])
async def get_role_permissions(
    role_id: int,
    _: Annotated[User, Depends(require_permission("admin", "view"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(Permission).where(Permission.role_id == role_id))
    return list(result.scalars().all())


@router.put("/roles/{role_id}/permissions", response_model=list[PermissionResponse])
async def update_role_permissions(
    role_id: int,
    body: list[PermissionUpdate],
    _: Annotated[User, Depends(require_permission("admin", "edit"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    role = await db.get(Role, role_id)
    if role is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Role not found")
    if role.name == "owner":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Owner permissions are fixed")

    for item in body:
        result = await db.execute(
            select(Permission).where(
                Permission.role_id == role_id, Permission.module == item.module
            )
        )
        perm = result.scalar_one_or_none()
        if perm is None:
            perm = Permission(role_id=role_id, module=item.module)
            db.add(perm)
        perm.can_view = item.can_view
        perm.can_edit = item.can_edit
        perm.can_delete = item.can_delete
    await db.flush()
    result = await db.execute(select(Permission).where(Permission.role_id == role_id))
    return list(result.scalars().all())


@router.get("/users", response_model=list[UserAdminResponse])
async def admin_list_users(
    _: Annotated[User, Depends(require_permission("admin", "view"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(User)
        .options(selectinload(User.role).selectinload(Role.permissions))
        .order_by(User.id)
    )
    return list(result.scalars().all())


@router.put("/users/{user_id}/role", response_model=UserAdminResponse)
async def assign_user_role(
    user_id: int,
    body: AssignRoleRequest,
    _: Annotated[User, Depends(require_permission("admin", "edit"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(User)
        .options(selectinload(User.role).selectinload(Role.permissions))
        .where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    role = await db.get(Role, body.role_id)
    if role is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Role not found")
    user.role_id = role.id
    await db.flush()
    result = await db.execute(
        select(User)
        .options(selectinload(User.role).selectinload(Role.permissions))
        .where(User.id == user_id)
    )
    return result.scalar_one()
