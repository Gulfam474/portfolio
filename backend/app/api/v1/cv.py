"""CV upload, preview, download, and LaTeX generation."""

from __future__ import annotations

from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.db import get_db
from app.core.permissions import require_permission
from app.models.cv import CVFile
from app.models.user import User
from app.schemas.cv import CVFileResponse
from app.services.latex_service import generate_cv_pdf
from app.services.storage_service import save_upload

router = APIRouter(prefix="/cv", tags=["cv"])


async def _owner_id(db: AsyncSession, fallback: User) -> int:
    settings = get_settings()
    result = await db.execute(
        select(User).where(User.email == settings.OWNER_EMAIL.lower())
    )
    owner = result.scalar_one_or_none()
    return owner.id if owner else fallback.id


@router.post("/upload", response_model=CVFileResponse, status_code=201)
async def upload_cv(
    user: Annotated[User, Depends(require_permission("cv", "edit"))],
    db: Annotated[AsyncSession, Depends(get_db)],
    file: UploadFile = File(...),
):
    """Upload a PDF CV and mark it as current."""
    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only PDF files are allowed")
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File too large (max 10MB)")
    await file.seek(0)

    owner_id = await _owner_id(db, user)
    path, url = await save_upload(file, "cv")

    existing = await db.execute(
        select(CVFile).where(CVFile.user_id == owner_id, CVFile.is_current.is_(True))
    )
    for old in existing.scalars().all():
        old.is_current = False

    record = CVFile(
        user_id=owner_id,
        filename=file.filename or "cv.pdf",
        storage_path=path,
        url=url,
        is_current=True,
    )
    db.add(record)
    await db.flush()
    await db.refresh(record)
    return record


@router.get("/preview", response_model=CVFileResponse)
async def preview_cv(db: Annotated[AsyncSession, Depends(get_db)]):
    """Return metadata for the current CV (public)."""
    settings = get_settings()
    result = await db.execute(
        select(CVFile)
        .join(User)
        .where(User.email == settings.OWNER_EMAIL.lower(), CVFile.is_current.is_(True))
    )
    record = result.scalar_one_or_none()
    if record is None:
        result = await db.execute(
            select(CVFile).where(CVFile.is_current.is_(True)).order_by(CVFile.id.desc())
        )
        record = result.scalar_one_or_none()
    if record is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No CV uploaded")
    return record


@router.get("/download")
async def download_cv(db: Annotated[AsyncSession, Depends(get_db)]):
    """Download the uploaded PDF as-is."""
    settings = get_settings()
    result = await db.execute(
        select(CVFile)
        .join(User)
        .where(User.email == settings.OWNER_EMAIL.lower(), CVFile.is_current.is_(True))
    )
    record = result.scalar_one_or_none()
    if record is None:
        result = await db.execute(
            select(CVFile).where(CVFile.is_current.is_(True)).order_by(CVFile.id.desc())
        )
        record = result.scalar_one_or_none()
    if record is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No CV uploaded")
    path = Path(record.storage_path)
    if not path.exists():
        media = Path(settings.MEDIA_ROOT)
        alt = media / Path(record.url).name
        if not alt.exists() and record.url.startswith("/media/"):
            alt = media / record.url.removeprefix("/media/")
        path = alt if alt.exists() else path
    if not path.exists():
        raise HTTPException(status.HTTP_404_NOT_FOUND, "CV file missing on disk")
    return FileResponse(path, media_type="application/pdf", filename=record.filename)


@router.get("/generate-latex")
async def generate_latex_cv(
    user: Annotated[User, Depends(require_permission("cv", "view"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Generate an ATS-style LaTeX CV PDF from profile data."""
    owner_id = await _owner_id(db, user)
    try:
        pdf_path = await generate_cv_pdf(db, owner_id)
    except RuntimeError as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename="cv_latex.pdf",
        content_disposition_type="attachment",
    )
