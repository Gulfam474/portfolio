"""Auth and user Pydantic schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    username_or_email: str
    password: str


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str = Field(min_length=6, max_length=6)


class ResendOTPRequest(BaseModel):
    email: EmailStr


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None


class RoleBrief(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    is_verified: bool
    is_active: bool
    avatar_url: Optional[str] = None
    role: Optional[RoleBrief] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ModulePermission(BaseModel):
    can_view: bool
    can_edit: bool
    can_delete: bool


class AccessMapResponse(BaseModel):
    permissions: dict[str, ModulePermission]


class MessageResponse(BaseModel):
    message: str
