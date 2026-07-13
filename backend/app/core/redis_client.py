"""Redis client for OTP storage, rate limiting, and token blacklist."""

from __future__ import annotations

from typing import Optional

import redis.asyncio as redis

from app.core.config import get_settings

_client: Optional[redis.Redis] = None


async def get_redis() -> redis.Redis:
    """Return a shared async Redis client."""
    global _client
    if _client is None:
        settings = get_settings()
        _client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _client


async def close_redis() -> None:
    """Close the shared Redis connection."""
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None
