"""Admin / RBAC schemas."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class PermissionUpdate(BaseModel):
    module: str
    can_view: bool = False
    can_edit: bool = False
    can_delete: bool = False


class PermissionResponse(PermissionUpdate):
    id: int

    model_config = {"from_attributes": True}


class RoleCreate(BaseModel):
    name: str = Field(min_length=2, max_length=50)
    description: Optional[str] = None


class RoleUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=50)
    description: Optional[str] = None


class RoleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    permissions: list[PermissionResponse] = []

    model_config = {"from_attributes": True}


class AssignRoleRequest(BaseModel):
    role_id: int


class UserAdminResponse(BaseModel):
    id: int
    username: str
    email: str
    is_verified: bool
    is_active: bool
    role: Optional[RoleResponse] = None

    model_config = {"from_attributes": True}
