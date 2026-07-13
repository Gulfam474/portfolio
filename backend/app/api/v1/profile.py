"""Profile CRUD and public overview endpoints."""

from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.db import get_db
from app.core.permissions import get_optional_user, require_permission
from app.models.cv import CVFile
from app.models.profile import (
    Certificate,
    Education,
    Experience,
    PersonalInfo,
    Project,
    Skill,
)
from app.models.user import User
from app.schemas.profile import (
    CertificateCreate,
    CertificateResponse,
    CertificateUpdate,
    EducationCreate,
    EducationResponse,
    EducationUpdate,
    ExperienceCreate,
    ExperienceResponse,
    ExperienceUpdate,
    PersonalInfoResponse,
    PersonalInfoUpdate,
    ProfileOverviewResponse,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
    SkillCreate,
    SkillResponse,
    SkillUpdate,
)
from app.services.storage_service import save_upload
from app.utils.validators import sanitize_html

router = APIRouter(prefix="/profile", tags=["profile"])


async def _owner_user(db: AsyncSession) -> User | None:
    """Resolve the site owner (owner role, or first user as fallback)."""
    settings = get_settings()
    result = await db.execute(
        select(User)
        .options(
            selectinload(User.personal_info),
            selectinload(User.education),
            selectinload(User.experience),
            selectinload(User.skills),
            selectinload(User.projects),
            selectinload(User.certificates),
            selectinload(User.cv_files),
            selectinload(User.role),
        )
        .where(User.email == settings.OWNER_EMAIL.lower())
    )
    user = result.scalar_one_or_none()
    if user:
        return user
    result = await db.execute(
        select(User)
        .options(
            selectinload(User.personal_info),
            selectinload(User.education),
            selectinload(User.experience),
            selectinload(User.skills),
            selectinload(User.projects),
            selectinload(User.certificates),
            selectinload(User.cv_files),
            selectinload(User.role),
        )
        .order_by(User.id)
        .limit(1)
    )
    return result.scalar_one_or_none()


def _filter_personal_public(info: PersonalInfo | None) -> PersonalInfo | None:
    if info is None:
        return None
    allowed = {f.strip() for f in (info.public_fields or "").split(",") if f.strip()}
    data = {c.name: getattr(info, c.name) for c in info.__table__.columns}
    for field in (
        "email_public",
        "phone",
        "location",
        "website",
        "github",
        "linkedin",
        "twitter",
    ):
        if field not in allowed:
            data[field] = ""
    # Build a lightweight response object via PersonalInfoResponse later
    info_copy = PersonalInfo(**{k: v for k, v in data.items() if k != "id"})
    info_copy.id = info.id
    info_copy.user_id = info.user_id
    return info_copy


def _overview_from_user(user: User, public_only: bool) -> ProfileOverviewResponse:
    cv_url = None
    current = next((c for c in user.cv_files if c.is_current), None)
    if current:
        cv_url = current.url

    personal = user.personal_info
    if public_only and personal:
        personal = _filter_personal_public(personal)

    edu = [e for e in user.education if (not public_only or e.public_visible)]
    exp = [e for e in user.experience if (not public_only or e.public_visible)]
    skills = [s for s in user.skills if (not public_only or s.public_visible)]
    projects = [p for p in user.projects if (not public_only or p.public_visible)]
    certificates = [
        c for c in user.certificates if (not public_only or c.public_visible)
    ]

    return ProfileOverviewResponse(
        personal_info=PersonalInfoResponse.model_validate(personal) if personal else None,
        education=[EducationResponse.model_validate(e) for e in sorted(edu, key=lambda x: x.sort_order)],
        experience=[ExperienceResponse.model_validate(e) for e in sorted(exp, key=lambda x: x.sort_order)],
        skills=[SkillResponse.model_validate(s) for s in sorted(skills, key=lambda x: x.sort_order)],
        projects=[ProjectResponse.model_validate(p) for p in sorted(projects, key=lambda x: x.sort_order)],
        certificates=[
            CertificateResponse.model_validate(c)
            for c in sorted(certificates, key=lambda x: x.sort_order)
        ],
        cv_url=cv_url,
    )


@router.get("/overview", response_model=ProfileOverviewResponse)
async def public_overview(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProfileOverviewResponse:
    """Public read-only profile overview (respects public_visible flags)."""
    owner = await _owner_user(db)
    if owner is None:
        return ProfileOverviewResponse()
    return _overview_from_user(owner, public_only=True)


@router.get("/overview/full", response_model=ProfileOverviewResponse)
async def full_overview(
    user: Annotated[User, Depends(require_permission("profile", "view"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProfileOverviewResponse:
    """Authenticated full overview (owner/editor sees everything)."""
    owner = await _owner_user(db)
    if owner is None:
        # Fall back to requesting user's own profile
        result = await db.execute(
            select(User)
            .options(
                selectinload(User.personal_info),
                selectinload(User.education),
                selectinload(User.experience),
                selectinload(User.skills),
                selectinload(User.projects),
                selectinload(User.certificates),
                selectinload(User.cv_files),
            )
            .where(User.id == user.id)
        )
        owner = result.scalar_one()
    return _overview_from_user(owner, public_only=False)


# ---- Personal info ----

@router.get("/personal-info", response_model=Optional[PersonalInfoResponse])
async def get_personal_info(
    user: Annotated[User, Depends(require_permission("profile", "view"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    owner = await _owner_user(db) or user
    result = await db.execute(
        select(PersonalInfo).where(PersonalInfo.user_id == owner.id)
    )
    return result.scalar_one_or_none()


@router.put("/personal-info", response_model=PersonalInfoResponse)
async def upsert_personal_info(
    body: PersonalInfoUpdate,
    user: Annotated[User, Depends(require_permission("profile", "edit"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    owner = await _owner_user(db) or user
    result = await db.execute(
        select(PersonalInfo).where(PersonalInfo.user_id == owner.id)
    )
    info = result.scalar_one_or_none()
    data = body.model_dump()
    if info is None:
        info = PersonalInfo(user_id=owner.id, **data)
        db.add(info)
    else:
        for k, v in data.items():
            if k == "avatar_url" and v is None and "avatar_url" not in body.model_fields_set:
                continue
            setattr(info, k, v)
    await db.flush()
    await db.refresh(info)
    return info


@router.post("/avatar", response_model=PersonalInfoResponse)
async def upload_avatar(
    user: Annotated[User, Depends(require_permission("profile", "edit"))],
    db: Annotated[AsyncSession, Depends(get_db)],
    file: UploadFile = File(...),
):
    """Upload a cropped profile image for the overview hero circle."""
    content_type = (file.content_type or "").lower()
    if not content_type.startswith("image/"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File must be an image")

    owner = await _owner_user(db) or user
    _, url = await save_upload(file, "avatars")

    result = await db.execute(
        select(PersonalInfo).where(PersonalInfo.user_id == owner.id)
    )
    info = result.scalar_one_or_none()
    if info is None:
        info = PersonalInfo(user_id=owner.id, full_name=owner.username, avatar_url=url)
        db.add(info)
    else:
        info.avatar_url = url

    owner.avatar_url = url
    await db.flush()
    await db.refresh(info)
    return info


# ---- Education ----

@router.get("/education", response_model=list[EducationResponse])
async def list_education(
    user: Annotated[User, Depends(require_permission("profile", "view"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    owner = await _owner_user(db) or user
    result = await db.execute(
        select(Education).where(Education.user_id == owner.id).order_by(Education.sort_order)
    )
    return list(result.scalars().all())


@router.post("/education", response_model=EducationResponse, status_code=201)
async def create_education(
    body: EducationCreate,
    user: Annotated[User, Depends(require_permission("profile", "edit"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    owner = await _owner_user(db) or user
    entry = Education(user_id=owner.id, **body.model_dump())
    db.add(entry)
    await db.flush()
    await db.refresh(entry)
    return entry


@router.put("/education/{entry_id}", response_model=EducationResponse)
async def update_education(
    entry_id: int,
    body: EducationUpdate,
    user: Annotated[User, Depends(require_permission("profile", "edit"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(Education).where(Education.id == entry_id))
    entry = result.scalar_one_or_none()
    if entry is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Education not found")
    for k, v in body.model_dump().items():
        setattr(entry, k, v)
    await db.flush()
    await db.refresh(entry)
    return entry


@router.delete("/education/{entry_id}", status_code=204)
async def delete_education(
    entry_id: int,
    user: Annotated[User, Depends(require_permission("profile", "delete"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(Education).where(Education.id == entry_id))
    entry = result.scalar_one_or_none()
    if entry is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Education not found")
    await db.delete(entry)


# ---- Experience ----

@router.get("/experience", response_model=list[ExperienceResponse])
async def list_experience(
    user: Annotated[User, Depends(require_permission("profile", "view"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    owner = await _owner_user(db) or user
    result = await db.execute(
        select(Experience).where(Experience.user_id == owner.id).order_by(Experience.sort_order)
    )
    return list(result.scalars().all())


@router.post("/experience", response_model=ExperienceResponse, status_code=201)
async def create_experience(
    body: ExperienceCreate,
    user: Annotated[User, Depends(require_permission("profile", "edit"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    owner = await _owner_user(db) or user
    data = body.model_dump()
    data["description"] = sanitize_html(data.get("description") or "")
    entry = Experience(user_id=owner.id, **data)
    db.add(entry)
    await db.flush()
    await db.refresh(entry)
    return entry


@router.put("/experience/{entry_id}", response_model=ExperienceResponse)
async def update_experience(
    entry_id: int,
    body: ExperienceUpdate,
    user: Annotated[User, Depends(require_permission("profile", "edit"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(Experience).where(Experience.id == entry_id))
    entry = result.scalar_one_or_none()
    if entry is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Experience not found")
    data = body.model_dump()
    data["description"] = sanitize_html(data.get("description") or "")
    for k, v in data.items():
        setattr(entry, k, v)
    await db.flush()
    await db.refresh(entry)
    return entry


@router.delete("/experience/{entry_id}", status_code=204)
async def delete_experience(
    entry_id: int,
    user: Annotated[User, Depends(require_permission("profile", "delete"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(Experience).where(Experience.id == entry_id))
    entry = result.scalar_one_or_none()
    if entry is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Experience not found")
    await db.delete(entry)


# ---- Skills ----

@router.get("/skills", response_model=list[SkillResponse])
async def list_skills(
    user: Annotated[User, Depends(require_permission("profile", "view"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    owner = await _owner_user(db) or user
    result = await db.execute(
        select(Skill).where(Skill.user_id == owner.id).order_by(Skill.sort_order)
    )
    return list(result.scalars().all())


@router.post("/skills", response_model=SkillResponse, status_code=201)
async def create_skill(
    body: SkillCreate,
    user: Annotated[User, Depends(require_permission("profile", "edit"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    owner = await _owner_user(db) or user
    entry = Skill(user_id=owner.id, **body.model_dump())
    db.add(entry)
    await db.flush()
    await db.refresh(entry)
    return entry


@router.put("/skills/{entry_id}", response_model=SkillResponse)
async def update_skill(
    entry_id: int,
    body: SkillUpdate,
    user: Annotated[User, Depends(require_permission("profile", "edit"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(Skill).where(Skill.id == entry_id))
    entry = result.scalar_one_or_none()
    if entry is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Skill not found")
    for k, v in body.model_dump().items():
        setattr(entry, k, v)
    await db.flush()
    await db.refresh(entry)
    return entry


@router.delete("/skills/{entry_id}", status_code=204)
async def delete_skill(
    entry_id: int,
    user: Annotated[User, Depends(require_permission("profile", "delete"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(Skill).where(Skill.id == entry_id))
    entry = result.scalar_one_or_none()
    if entry is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Skill not found")
    await db.delete(entry)


# ---- Projects ----

@router.get("/projects", response_model=list[ProjectResponse])
async def list_projects(
    user: Annotated[User, Depends(require_permission("profile", "view"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    owner = await _owner_user(db) or user
    result = await db.execute(
        select(Project).where(Project.user_id == owner.id).order_by(Project.sort_order)
    )
    return list(result.scalars().all())


@router.post("/projects", response_model=ProjectResponse, status_code=201)
async def create_project(
    body: ProjectCreate,
    user: Annotated[User, Depends(require_permission("profile", "edit"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    owner = await _owner_user(db) or user
    data = body.model_dump()
    data["description"] = sanitize_html(data.get("description") or "")
    entry = Project(user_id=owner.id, **data)
    db.add(entry)
    await db.flush()
    await db.refresh(entry)
    return entry


@router.put("/projects/{entry_id}", response_model=ProjectResponse)
async def update_project(
    entry_id: int,
    body: ProjectUpdate,
    user: Annotated[User, Depends(require_permission("profile", "edit"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(Project).where(Project.id == entry_id))
    entry = result.scalar_one_or_none()
    if entry is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    data = body.model_dump()
    data["description"] = sanitize_html(data.get("description") or "")
    for k, v in data.items():
        setattr(entry, k, v)
    await db.flush()
    await db.refresh(entry)
    return entry


@router.delete("/projects/{entry_id}", status_code=204)
async def delete_project(
    entry_id: int,
    user: Annotated[User, Depends(require_permission("profile", "delete"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(Project).where(Project.id == entry_id))
    entry = result.scalar_one_or_none()
    if entry is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    await db.delete(entry)


@router.post("/projects/{entry_id}/thumbnail", response_model=ProjectResponse)
async def upload_project_thumbnail(
    entry_id: int,
    user: Annotated[User, Depends(require_permission("profile", "edit"))],
    db: Annotated[AsyncSession, Depends(get_db)],
    file: UploadFile = File(...),
):
    result = await db.execute(select(Project).where(Project.id == entry_id))
    entry = result.scalar_one_or_none()
    if entry is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Project not found")
    _, url = await save_upload(file, "project_thumbs")
    entry.thumbnail_url = url
    await db.flush()
    await db.refresh(entry)
    return entry


# ---- Certificates ----

@router.get("/certificates", response_model=list[CertificateResponse])
async def list_certificates(
    user: Annotated[User, Depends(require_permission("profile", "view"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    owner = await _owner_user(db) or user
    result = await db.execute(
        select(Certificate)
        .where(Certificate.user_id == owner.id)
        .order_by(Certificate.sort_order)
    )
    return list(result.scalars().all())


@router.post("/certificates", response_model=CertificateResponse, status_code=201)
async def create_certificate(
    body: CertificateCreate,
    user: Annotated[User, Depends(require_permission("profile", "edit"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    owner = await _owner_user(db) or user
    entry = Certificate(user_id=owner.id, **body.model_dump())
    db.add(entry)
    await db.flush()
    await db.refresh(entry)
    return entry


@router.put("/certificates/{entry_id}", response_model=CertificateResponse)
async def update_certificate(
    entry_id: int,
    body: CertificateUpdate,
    user: Annotated[User, Depends(require_permission("profile", "edit"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(Certificate).where(Certificate.id == entry_id))
    entry = result.scalar_one_or_none()
    if entry is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Certificate not found")
    for k, v in body.model_dump().items():
        setattr(entry, k, v)
    await db.flush()
    await db.refresh(entry)
    return entry


@router.delete("/certificates/{entry_id}", status_code=204)
async def delete_certificate(
    entry_id: int,
    user: Annotated[User, Depends(require_permission("profile", "delete"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(Certificate).where(Certificate.id == entry_id))
    entry = result.scalar_one_or_none()
    if entry is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Certificate not found")
    await db.delete(entry)
