"""File storage abstraction supporting local disk and private S3-compatible buckets."""

from __future__ import annotations

import uuid
from pathlib import Path

import aiofiles
from fastapi import UploadFile

from app.core.config import get_settings

PRESIGNED_URL_TTL_SECONDS = 6 * 24 * 3600  # ~6 days, under the typical 7-day SigV4 cap


def _s3_client():
    import boto3

    settings = get_settings()
    return boto3.client(
        "s3",
        aws_access_key_id=settings.S3_ACCESS_KEY,
        aws_secret_access_key=settings.S3_SECRET_KEY,
        region_name=settings.S3_REGION or None,
        endpoint_url=settings.S3_ENDPOINT_URL or None,
    )


async def save_upload(file: UploadFile, subdir: str = "uploads") -> tuple[str, str]:
    """
    Persist an uploaded file.

    Returns (storage_path, stored_reference). For the local backend,
    stored_reference is a `/media/...` path served directly by the app. For
    the s3 backend the bucket is private, so stored_reference is just the
    object key — resolve_media_url() turns it into a usable (presigned) URL
    on read, since a permanent public URL can't be handed out at upload time.
    """
    settings = get_settings()
    ext = Path(file.filename or "file").suffix.lower()
    name = f"{uuid.uuid4().hex}{ext}"

    if settings.STORAGE_BACKEND == "s3":
        return await _save_s3(file, subdir, name)

    media_root = Path(settings.MEDIA_ROOT)
    target_dir = media_root / subdir
    target_dir.mkdir(parents=True, exist_ok=True)
    path = target_dir / name
    async with aiofiles.open(path, "wb") as out:
        while chunk := await file.read(1024 * 1024):
            await out.write(chunk)
    relative = f"/media/{subdir}/{name}"
    return str(path), relative


async def _save_s3(file: UploadFile, subdir: str, name: str) -> tuple[str, str]:
    """Upload to any S3-compatible storage (AWS S3, Backblaze B2, R2, ...) via boto3."""
    settings = get_settings()
    key = f"{subdir}/{name}"
    client = _s3_client()
    body = await file.read()
    client.put_object(
        Bucket=settings.S3_BUCKET_NAME,
        Key=key,
        Body=body,
        ContentType=file.content_type or "application/octet-stream",
    )
    return key, key


def resolve_media_url(value: str | None) -> str | None:
    """Turn a stored media reference into a URL the browser can fetch.

    Local-backend values are already `/media/...` paths or full URLs and
    pass through unchanged. S3-backend values are bare object keys against a
    private bucket, so a fresh presigned GET URL is generated on every read.
    """
    if not value:
        return value
    if value.startswith("/media/") or value.startswith("http"):
        return value
    settings = get_settings()
    if settings.STORAGE_BACKEND != "s3":
        return value
    client = _s3_client()
    return client.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.S3_BUCKET_NAME, "Key": value},
        ExpiresIn=PRESIGNED_URL_TTL_SECONDS,
    )
