"""Profile domain Pydantic schemas."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class PersonalInfoBase(BaseModel):
    full_name: str = ""
    title: str = ""
    tagline: str = ""
    bio: str = ""
    location: str = ""
    email_public: str = ""
    phone: str = ""
    website: str = ""
    github: str = ""
    linkedin: str = ""
    twitter: str = ""
    avatar_url: Optional[str] = None
    public_fields: str = (
        "full_name,title,tagline,bio,location,website,github,linkedin,twitter,avatar_url"
    )


class PersonalInfoUpdate(PersonalInfoBase):
    pass


class PersonalInfoResponse(PersonalInfoBase):
    id: int
    user_id: int

    model_config = {"from_attributes": True}


class EducationBase(BaseModel):
    institution: str
    degree: str
    field_of_study: str = ""
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    grade: str = ""
    description: str = ""
    sort_order: int = 0
    public_visible: bool = True


class EducationCreate(EducationBase):
    pass


class EducationUpdate(EducationBase):
    pass


class EducationResponse(EducationBase):
    id: int
    user_id: int

    model_config = {"from_attributes": True}


class ExperienceBase(BaseModel):
    company: str
    role: str
    location: str = ""
    start_date: str = ""
    end_date: str = ""
    is_current: bool = False
    description: str = ""
    sort_order: int = 0
    public_visible: bool = True


class ExperienceCreate(ExperienceBase):
    pass


class ExperienceUpdate(ExperienceBase):
    pass


class ExperienceResponse(ExperienceBase):
    id: int
    user_id: int

    model_config = {"from_attributes": True}


class SkillBase(BaseModel):
    name: str
    group: str = "General"
    proficiency: float = Field(default=80.0, ge=0, le=100)
    sort_order: int = 0
    public_visible: bool = True


class SkillCreate(SkillBase):
    pass


class SkillUpdate(SkillBase):
    pass


class SkillResponse(SkillBase):
    id: int
    user_id: int

    model_config = {"from_attributes": True}


class ProjectBase(BaseModel):
    title: str
    description: str = ""
    tech_stack: str = ""
    project_url: str = ""
    repo_url: str = ""
    thumbnail_url: Optional[str] = None
    sort_order: int = 0
    public_visible: bool = True


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(ProjectBase):
    pass


class ProjectResponse(ProjectBase):
    id: int
    user_id: int

    model_config = {"from_attributes": True}


class CertificateBase(BaseModel):
    name: str
    issuer: str = ""
    year: Optional[int] = None
    credential_url: str = ""
    description: str = ""
    sort_order: int = 0
    public_visible: bool = True


class CertificateCreate(CertificateBase):
    pass


class CertificateUpdate(CertificateBase):
    pass


class CertificateResponse(CertificateBase):
    id: int
    user_id: int

    model_config = {"from_attributes": True}


class ProfileOverviewResponse(BaseModel):
    personal_info: Optional[PersonalInfoResponse] = None
    education: list[EducationResponse] = []
    experience: list[ExperienceResponse] = []
    skills: list[SkillResponse] = []
    projects: list[ProjectResponse] = []
    certificates: list[CertificateResponse] = []
    cv_url: Optional[str] = None
