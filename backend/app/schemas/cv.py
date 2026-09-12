"""CV schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, field_validator

from app.services.storage_service import resolve_media_url


class CVFileResponse(BaseModel):
    id: int
    filename: str
    url: str
    is_current: bool
    uploaded_at: datetime

    model_config = {"from_attributes": True}

    @field_validator("url")
    @classmethod
    def _resolve_url(cls, v: str) -> str:
        return resolve_media_url(v) or v
