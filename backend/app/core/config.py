"""Application settings loaded from environment via pydantic-settings."""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration for the FastAPI backend."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ENV: str = "development"
    SECRET_KEY: str = "change_me_super_secret"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    DATABASE_URL: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/engineer_portfolio"
    )
    REDIS_URL: str = "redis://localhost:6379/0"

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = (
        "http://localhost:8000/api/v1/auth/google/callback"
    )

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@example.com"
    OTP_EXPIRE_MINUTES: int = 10

    STORAGE_BACKEND: Literal["local", "s3"] = "local"
    MEDIA_ROOT: str = "./media"
    S3_BUCKET_NAME: str = ""
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""
    S3_REGION: str = ""

    FRONTEND_URL: str = "http://localhost:5173"
    LATEX_OUTPUT_DIR: str = "./generated_cv"
    OWNER_EMAIL: str = "owner@example.com"

    @property
    def is_development(self) -> bool:
        return self.ENV.lower() in {"development", "dev", "local"}


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings."""
    return Settings()
