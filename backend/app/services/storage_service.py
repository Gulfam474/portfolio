"""File storage abstraction supporting local disk and S3."""

from __future__ import annotations

import uuid
from pathlib import Path

import aiofiles
from fastapi import UploadFile

from app.core.config import get_settings


async def save_upload(file: UploadFile, subdir: str = "uploads") -> tuple[str, str]:
    """
    Persist an uploaded file.

    Returns (storage_path, public_url).
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
    """Upload to S3-compatible storage via boto3."""
    import boto3

    settings = get_settings()
    key = f"{subdir}/{name}"
    client = boto3.client(
        "s3",
        aws_access_key_id=settings.S3_ACCESS_KEY,
        aws_secret_access_key=settings.S3_SECRET_KEY,
        region_name=settings.S3_REGION or None,
    )
    body = await file.read()
    client.put_object(
        Bucket=settings.S3_BUCKET_NAME,
        Key=key,
        Body=body,
        ContentType=file.content_type or "application/octet-stream",
    )
    url = f"https://{settings.S3_BUCKET_NAME}.s3.amazonaws.com/{key}"
    return key, url
