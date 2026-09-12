"""Post schemas."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.services.storage_service import resolve_media_url


class AuthorBrief(BaseModel):
    id: int
    username: str
    avatar_url: Optional[str] = None

    model_config = {"from_attributes": True}

    @field_validator("avatar_url")
    @classmethod
    def _resolve_avatar_url(cls, v: Optional[str]) -> Optional[str]:
        return resolve_media_url(v)


class PostCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    content: str


class PostUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    content: Optional[str] = None


class PostResponse(BaseModel):
    id: int
    title: str
    content: str
    image_url: Optional[str] = None
    author: AuthorBrief
    like_count: int = 0
    comment_count: int = 0
    liked_by_me: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("image_url")
    @classmethod
    def _resolve_image_url(cls, v: Optional[str]) -> Optional[str]:
        return resolve_media_url(v)


class PostListResponse(BaseModel):
    items: list[PostResponse]
    total: int
    page: int
    page_size: int


class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class CommentResponse(BaseModel):
    id: int
    content: str
    user: AuthorBrief
    created_at: datetime

    model_config = {"from_attributes": True}
