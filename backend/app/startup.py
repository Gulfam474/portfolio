"""Database seed helpers for default roles and owner account."""

from __future__ import annotations

import logging

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.db import AsyncSessionLocal
from app.core.security import hash_password
from app.models.profile import PersonalInfo
from app.models.role import Permission, Role
from app.models.user import User

logger = logging.getLogger(__name__)

MODULES = ["profile", "cv", "posts", "admin"]

ROLE_DEFS = {
    "owner": {
        "description": "Site owner — full access",
        "perms": {m: (True, True, True) for m in MODULES},
    },
    "admin": {
        "description": "Administrator",
        "perms": {
            "profile": (True, True, True),
            "cv": (True, True, True),
            "posts": (True, True, True),
            "admin": (True, True, False),
        },
    },
    "editor": {
        "description": "Content editor",
        "perms": {
            "profile": (True, True, False),
            "cv": (True, True, False),
            "posts": (True, True, True),
            "admin": (False, False, False),
        },
    },
    "viewer": {
        "description": "Authenticated viewer",
        "perms": {
            "profile": (True, False, False),
            "cv": (True, False, False),
            "posts": (True, False, False),
            "admin": (False, False, False),
        },
    },
    "guest": {
        "description": "Default registered user / public role",
        "perms": {
            "profile": (True, False, False),
            "cv": (True, False, False),
            "posts": (True, False, False),
            "admin": (False, False, False),
        },
    },
}


async def seed_roles_and_owner() -> None:
    """Ensure default roles, permissions, and an owner account exist."""
    settings = get_settings()
    async with AsyncSessionLocal() as db:
        try:
            for name, meta in ROLE_DEFS.items():
                result = await db.execute(
                    select(Role)
                    .options(selectinload(Role.permissions))
                    .where(Role.name == name)
                )
                role = result.scalar_one_or_none()
                if role is None:
                    role = Role(name=name, description=meta["description"])
                    db.add(role)
                    await db.flush()
                    for module, (v, e, d) in meta["perms"].items():
                        db.add(
                            Permission(
                                role_id=role.id,
                                module=module,
                                can_view=v,
                                can_edit=e,
                                can_delete=d,
                            )
                        )
                    logger.info("Seeded role: %s", name)

            await db.flush()
            owner_role = (
                await db.execute(select(Role).where(Role.name == "owner"))
            ).scalar_one()

            result = await db.execute(
                select(User).where(User.email == settings.OWNER_EMAIL.lower())
            )
            owner = result.scalar_one_or_none()
            if owner is None:
                # Prefer existing username=owner account when OWNER_EMAIL changes
                result = await db.execute(select(User).where(User.username == "owner"))
                owner = result.scalar_one_or_none()
                if owner is not None:
                    owner.email = settings.OWNER_EMAIL.lower()
                    owner.role_id = owner_role.id
                    owner.is_verified = True
                else:
                    owner = User(
                        username="owner",
                        email=settings.OWNER_EMAIL.lower(),
                        hashed_password=hash_password("ChangeMe123!"),
                        is_verified=True,
                        role_id=owner_role.id,
                    )
                    db.add(owner)
                    await db.flush()
                    db.add(
                        PersonalInfo(
                            user_id=owner.id,
                            full_name="Your Name",
                            title="Software Developer",
                            tagline="",
                            bio="",
                            location="",
                        )
                    )
                    logger.info(
                        "Seeded owner account %s / ChangeMe123!", settings.OWNER_EMAIL
                    )
            else:
                owner.role_id = owner_role.id
                owner.is_verified = True

            await db.commit()
        except Exception:
            await db.rollback()
            logger.exception("Seed failed — is the database up?")
