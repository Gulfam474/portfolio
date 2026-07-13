"""FastAPI application entrypoint."""

from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.redis_client import close_redis
from app.services.oauth_service import configure_oauth
from app.startup import seed_roles_and_owner


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Startup / shutdown hooks."""
    configure_oauth()
    await seed_roles_and_owner()
    yield
    await close_redis()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Engineer Portfolio API",
        version="1.0.0",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            settings.FRONTEND_URL,
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    # Must wrap the app so Authlib can persist OAuth `state` in a signed cookie.
    # same_site=lax is required for the Google redirect GET to include the cookie.
    app.add_middleware(
        SessionMiddleware,
        secret_key=settings.SECRET_KEY,
        session_cookie="portfolio_oauth_session",
        same_site="lax",
        https_only=False,
        max_age=600,
    )

    media_root = Path(settings.MEDIA_ROOT)
    media_root.mkdir(parents=True, exist_ok=True)
    app.mount("/media", StaticFiles(directory=str(media_root)), name="media")

    app.include_router(api_router, prefix="/api/v1")

    @app.get("/health")
    async def health():
        return {"status": "ok"}

    return app


app = create_app()
