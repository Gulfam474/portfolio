"""Google OAuth2 helpers via Authlib."""

from __future__ import annotations

from authlib.integrations.starlette_client import OAuth

from app.core.config import get_settings

oauth = OAuth()
_google_ready = False


def configure_oauth() -> None:
    """Register the Google OAuth client once if credentials are present."""
    global _google_ready
    if _google_ready:
        return

    settings = get_settings()
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        return

    oauth.register(
        name="google",
        client_id=settings.GOOGLE_CLIENT_ID,
        client_secret=settings.GOOGLE_CLIENT_SECRET,
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )
    _google_ready = True


async def get_google_userinfo(token: dict) -> dict:
    """Fetch Google userinfo from an access token response."""
    resp = await oauth.google.get(
        "https://openidconnect.googleapis.com/v1/userinfo", token=token
    )
    return resp.json()
