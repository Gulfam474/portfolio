"""CV schemas."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class CVFileResponse(BaseModel):
    id: int
    filename: str
    url: str
    is_current: bool
    uploaded_at: datetime

    model_config = {"from_attributes": True}
