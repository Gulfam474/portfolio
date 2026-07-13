"""JWT helpers, password hashing, and OTP generation."""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    """Hash a plain-text password with bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plain-text password against a bcrypt hash."""
    return pwd_context.verify(plain, hashed)


def generate_otp(length: int = 6) -> str:
    """Generate a numeric one-time password."""
    upper = 10**length
    return str(secrets.randbelow(upper)).zfill(length)


def create_access_token(subject: str | int, extra: dict[str, Any] | None = None) -> str:
    """Create a short-lived JWT access token."""
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload: dict[str, Any] = {"sub": str(subject), "type": "access", "exp": expire}
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(subject: str | int) -> str:
    """Create a long-lived JWT refresh token."""
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    payload = {"sub": str(subject), "type": "refresh", "exp": expire, "jti": secrets.token_hex(16)}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    """Decode and validate a JWT; raises JWTError on failure."""
    settings = get_settings()
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])


def safe_decode_token(token: str) -> dict[str, Any] | None:
    """Decode a JWT returning None on failure."""
    try:
        return decode_token(token)
    except JWTError:
        return None
