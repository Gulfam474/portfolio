"""OTP record model (Redis is primary store; DB table optional for audit)."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class OTPRecord(Base):
    """Optional audit trail for OTP issuance (runtime OTP lives in Redis)."""

    __tablename__ = "otp_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), index=True)
    purpose: Mapped[str] = mapped_column(String(50), default="verify")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
