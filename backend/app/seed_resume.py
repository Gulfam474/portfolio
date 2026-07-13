"""Seed Gulfam Shaikh resume data into the owner profile + upload CV PDF."""

from __future__ import annotations

import asyncio
import shutil
import uuid
from pathlib import Path

from sqlalchemy import delete, select
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.db import AsyncSessionLocal
from app.core.security import hash_password
from app.models.cv import CVFile
from app.models.profile import (
    Certificate,
    Education,
    Experience,
    PersonalInfo,
    Project,
    Skill,
)
from app.models.role import Role
from app.models.user import User

RESUME_PDF = Path(__file__).resolve().parents[2] / "Gulfam_Shaikh_FlowCV_Resume_2026-07-07.pdf"

BIO = (
    "Software Engineer with expertise in Python, FastAPI, PostgreSQL, REST APIs, "
    "Celery, and AI-driven backend systems. Experienced in building scalable, "
    "production-grade applications, asynchronous data pipelines, and third-party "
    "integrations, including Apple Search Ads, App Store Connect, and FoxData. "
    "Passionate about designing high-performance backend solutions, solving complex "
    "problems, and quickly adapting to new technologies."
)

EXPERIENCES = [
    {
        "company": "Quantumquake",
        "role": "Software Developer",
        "location": "Noida",
        "start_date": "04/2026",
        "end_date": "",
        "is_current": True,
        "sort_order": 0,
        "description": (
            "<ul>"
            "<li>Built ML-powered ASA/ASO platform backend automating bid optimization, "
            "keyword intelligence, and campaign management for mobile app marketers.</li>"
            "<li>Designed Celery ingestion pipelines syncing ASA, App Store Connect, and "
            "FoxData feeds across multi-tenant accounts with ops-triggered dispatch.</li>"
            "<li>Implemented human-in-the-loop AI agents with guardrails, approval flows, "
            "and validated execution payloads for Apple API actions.</li>"
            "<li>Architected 118-table Postgres schema with audit trails, idempotency, "
            "and dead-letter queue for production-grade MarTech automation.</li>"
            "</ul>"
        ),
    },
    {
        "company": "Askmeidentity",
        "role": "Software Developer Engineer",
        "location": "Bangalore",
        "start_date": "01/2026",
        "end_date": "03/2026",
        "is_current": False,
        "sort_order": 1,
        "description": (
            "<ul>"
            "<li>Backend developer for an LMS project — designing and shipping REST APIs.</li>"
            "<li>Handled complex database queries and query optimization.</li>"
            "<li>Leveraged Django ORM for migrations, complex querysets, and secure data "
            "handling on the LMS platform.</li>"
            "</ul>"
        ),
    },
    {
        "company": "Digital Think Technology LLP",
        "role": "Software Developer",
        "location": "Bangalore",
        "start_date": "02/2025",
        "end_date": "01/2026",
        "is_current": False,
        "sort_order": 2,
        "description": (
            "<ul>"
            "<li>Designed and developed scalable RESTful APIs for an enterprise ERP platform, "
            "improving data flow between frontend and backend.</li>"
            "<li>Optimized complex SQL queries and database schemas, reducing API response latency.</li>"
            "<li>Collaborated closely with BD and frontend teams to deliver product features.</li>"
            "</ul>"
        ),
    },
    {
        "company": "ROBOWAVES",
        "role": "Data Analyst Intern",
        "location": "Pune",
        "start_date": "02/2024",
        "end_date": "01/2025",
        "is_current": False,
        "sort_order": 3,
        "description": (
            "<ul>"
            "<li>Worked with Python, data analysis, transformation, visualization, Excel, "
            "Power BI, and Tableau.</li>"
            "<li>Cleaned datasets, transformed data, and built dashboards in Power BI, "
            "Tableau, Excel, and Python.</li>"
            "</ul>"
        ),
    },
]

EDUCATION = [
    {
        "institution": "SCSMCOE, Nepti, Ahmednagar",
        "degree": "Bachelor of Engineering (BE) in Computer Engineering",
        "field_of_study": "Computer Engineering",
        "start_year": 2020,
        "end_year": 2024,
        "grade": "CGPA: 8.32",
        "description": "Ahmednagar, MH",
        "sort_order": 0,
    },
    {
        "institution": "Shri Chhatrapati Shivaji Mahavidyalaya",
        "degree": "Higher Secondary Certificate (HSC)",
        "field_of_study": "",
        "start_year": 2019,
        "end_year": 2020,
        "grade": "",
        "description": "Shrigonda, MH",
        "sort_order": 1,
    },
]

SKILLS = [
    # Programming
    ("Python", "Programming & Scripting", 95),
    ("OOP", "Programming & Scripting", 90),
    ("Data Structures", "Programming & Scripting", 88),
    ("System Design", "Programming & Scripting", 80),
    # Frameworks
    ("FastAPI", "Frameworks & APIs", 92),
    ("Django", "Frameworks & APIs", 88),
    ("Flask", "Frameworks & APIs", 75),
    ("REST API", "Frameworks & APIs", 92),
    # Database
    ("PostgreSQL", "Database & SQL", 90),
    ("MySQL", "Database & SQL", 85),
    ("Oracle DB", "Database & SQL", 70),
    ("SQL Optimization", "Database & SQL", 85),
    ("PL/SQL", "Database & SQL", 75),
    # AI
    ("Agentic AI", "AI & Automation", 85),
    ("Chatbots", "AI & Automation", 80),
    ("Prompt Engineering", "AI & Automation", 85),
    # Data
    ("Pandas", "Data Analysis & Visualization", 85),
    ("NumPy", "Data Analysis & Visualization", 80),
    ("Matplotlib", "Data Analysis & Visualization", 75),
    ("Seaborn", "Data Analysis & Visualization", 75),
    ("Power BI", "Data Analysis & Visualization", 80),
    ("Tableau", "Data Analysis & Visualization", 75),
    ("Excel", "Data Analysis & Visualization", 85),
    # Tools
    ("Git", "Tools", 90),
    ("Docker", "Tools", 85),
    ("Redis", "Tools", 85),
    ("Celery", "Tools", 90),
    ("VS Code", "Tools", 90),
    ("Cursor", "Tools", 88),
    ("Ubuntu", "Tools", 80),
    # Soft
    ("Adaptability", "Soft Skills", 90),
    ("Teamwork", "Soft Skills", 90),
    ("Leadership", "Soft Skills", 80),
    ("Critical Thinking", "Soft Skills", 85),
]

PROJECTS = [
    {
        "title": "ML-powered ASA/ASO Marketing Automation Platform",
        "description": (
            "<p>AI-Powered Apple Search Ads &amp; App Store Optimization Platform.</p>"
            "<ul>"
            "<li>Built scalable FastAPI backends for ASA/ASO automation.</li>"
            "<li>Celery pipelines syncing Apple Search Ads, App Store Connect, and FoxData "
            "across multi-tenant accounts.</li>"
            "<li>AI agent workflows with human-in-the-loop approval, guardrails, and audit logging.</li>"
            "<li>118+ table PostgreSQL schema with idempotency, DLQ, retries, and monitoring.</li>"
            "</ul>"
        ),
        "tech_stack": (
            "Python, FastAPI, PostgreSQL, Celery, Redis, SQLAlchemy, "
            "Apple Search Ads API, App Store Connect API, FoxData API, Docker"
        ),
        "project_url": "",
        "repo_url": "",
        "sort_order": 0,
    },
    {
        "title": "Enterprise ERP Platform",
        "description": (
            "<p>Co-developed a comprehensive ERP application with modular Django REST APIs "
            "to automate core business workflows.</p>"
        ),
        "tech_stack": "Python, MySQL, Django, Django REST Framework",
        "project_url": "",
        "repo_url": "",
        "sort_order": 1,
    },
    {
        "title": "Virtual Mouse",
        "description": (
            "<p>Computer-vision console application using hand-gesture recognition to "
            "execute virtual mouse actions (clicking, scrolling, zooming) touch-free.</p>"
        ),
        "tech_stack": "Python, OpenCV, Computer Vision",
        "project_url": "",
        "repo_url": "",
        "sort_order": 2,
    },
]

CERTIFICATES = [
    {"name": "Data Analysis", "issuer": "", "sort_order": 0},
    {"name": "Python", "issuer": "", "sort_order": 1},
    {"name": "Data Science", "issuer": "", "sort_order": 2},
    {"name": "SQL", "issuer": "", "sort_order": 3},
    {"name": "Data Visualization", "issuer": "", "sort_order": 4},
]


async def seed_resume() -> None:
    settings = get_settings()
    async with AsyncSessionLocal() as db:
        owner_role = (
            await db.execute(select(Role).where(Role.name == "owner"))
        ).scalar_one()

        result = await db.execute(
            select(User)
            .options(selectinload(User.personal_info))
            .where(User.username == "owner")
        )
        owner = result.scalar_one_or_none()
        if owner is None:
            result = await db.execute(
                select(User)
                .options(selectinload(User.personal_info))
                .where(User.email == settings.OWNER_EMAIL.lower())
            )
            owner = result.scalar_one_or_none()

        if owner is None:
            owner = User(
                username="owner",
                email=settings.OWNER_EMAIL.lower(),
                hashed_password=hash_password("ChangeMe123!"),
                is_verified=True,
                role_id=owner_role.id,
            )
            db.add(owner)
            await db.flush()
        else:
            owner.email = settings.OWNER_EMAIL.lower()
            owner.role_id = owner_role.id
            owner.is_verified = True

        # Clear existing profile rows for a clean replace
        for model in (Education, Experience, Skill, Project, Certificate, CVFile):
            await db.execute(delete(model).where(model.user_id == owner.id))

        info = owner.personal_info
        payload = dict(
            full_name="Gulfam Shaikh",
            title="Software Developer",
            tagline=(
                "Python · FastAPI · PostgreSQL · Celery · AI-driven backend systems"
            ),
            bio=BIO,
            location="India",
            email_public="gulfamshaikh474@gmail.com",
            phone="7768866875",
            website="",
            github="",
            linkedin="",
            twitter="",
            public_fields=(
                "full_name,title,tagline,bio,location,email_public,phone,"
                "website,github,linkedin,twitter,avatar_url"
            ),
        )
        if info is None:
            db.add(PersonalInfo(user_id=owner.id, **payload))
        else:
            for k, v in payload.items():
                setattr(info, k, v)

        for row in EDUCATION:
            db.add(Education(user_id=owner.id, public_visible=True, **row))
        for row in EXPERIENCES:
            db.add(Experience(user_id=owner.id, public_visible=True, **row))
        for i, (name, group, proficiency) in enumerate(SKILLS):
            db.add(
                Skill(
                    user_id=owner.id,
                    name=name,
                    group=group,
                    proficiency=float(proficiency),
                    sort_order=i,
                    public_visible=True,
                )
            )
        for row in PROJECTS:
            db.add(Project(user_id=owner.id, public_visible=True, thumbnail_url=None, **row))
        for row in CERTIFICATES:
            db.add(Certificate(user_id=owner.id, public_visible=True, **row))

        # Store CV PDF under media/
        if RESUME_PDF.exists():
            media_root = Path(settings.MEDIA_ROOT)
            cv_dir = media_root / "cv"
            cv_dir.mkdir(parents=True, exist_ok=True)
            dest_name = f"{uuid.uuid4().hex}.pdf"
            dest = cv_dir / dest_name
            shutil.copy2(RESUME_PDF, dest)
            db.add(
                CVFile(
                    user_id=owner.id,
                    filename=RESUME_PDF.name,
                    storage_path=str(dest),
                    url=f"/media/cv/{dest_name}",
                    is_current=True,
                )
            )
            print(f"Uploaded CV -> {dest}")
        else:
            print(f"WARNING: resume PDF not found at {RESUME_PDF}")

        await db.commit()
        print(f"Seeded resume profile for {owner.email} (id={owner.id})")


if __name__ == "__main__":
    asyncio.run(seed_resume())
