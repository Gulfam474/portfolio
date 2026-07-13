"""Authentication endpoints: register, OTP, login, Google OAuth, refresh, logout."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.db import get_db
from app.core.permissions import (
    build_permissions_map,
    get_current_user,
)
from app.core.redis_client import get_redis
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_otp,
    hash_password,
    safe_decode_token,
    verify_password,
)
from app.models.role import Role
from app.models.user import User
from app.schemas.auth import (
    AccessMapResponse,
    LoginRequest,
    MessageResponse,
    ModulePermission,
    OTPVerifyRequest,
    RegisterRequest,
    ResendOTPRequest,
    TokenResponse,
    UserResponse,
)
from app.services.email_service import send_otp_email
from app.services.oauth_service import configure_oauth, oauth

router = APIRouter(prefix="/auth", tags=["auth"])
REFRESH_COOKIE = "refresh_token"


def _set_refresh_cookie(response: Response, token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=token,
        httponly=True,
        secure=not settings.is_development,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/api/v1/auth",
    )


async def _get_guest_role(db: AsyncSession) -> Role | None:
    result = await db.execute(select(Role).where(Role.name == "guest"))
    return result.scalar_one_or_none()


@router.post("/register", response_model=MessageResponse, status_code=201)
async def register(
    body: RegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    """Register a new user and send email OTP for verification."""
    existing = await db.execute(
        select(User).where(
            or_(User.email == body.email, User.username == body.username)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, "Username or email already exists")

    guest = await _get_guest_role(db)
    user = User(
        username=body.username,
        email=body.email.lower(),
        hashed_password=hash_password(body.password),
        is_verified=False,
        role_id=guest.id if guest else None,
    )
    db.add(user)
    await db.flush()

    settings = get_settings()
    otp = generate_otp()
    redis = await get_redis()
    await redis.setex(f"otp:{user.email}", settings.OTP_EXPIRE_MINUTES * 60, otp)
    await send_otp_email(user.email, otp)
    return MessageResponse(message="Registered. Check your email for the OTP.")


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(
    body: OTPVerifyRequest,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    """Validate OTP, mark user verified, and issue JWT tokens."""
    redis = await get_redis()
    email = body.email.lower()
    stored = await redis.get(f"otp:{email}")
    if not stored or stored != body.otp:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired OTP")

    result = await db.execute(
        select(User)
        .options(selectinload(User.role))
        .where(User.email == email)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")

    user.is_verified = True
    await redis.delete(f"otp:{email}")

    access = create_access_token(user.id)
    refresh = create_refresh_token(user.id)
    _set_refresh_cookie(response, refresh)
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.post("/resend-otp", response_model=MessageResponse)
async def resend_otp(
    body: ResendOTPRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    """Resend OTP with a 60s rate limit."""
    email = body.email.lower()
    redis = await get_redis()
    rate_key = f"otp_rate:{email}"
    if await redis.exists(rate_key):
        raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS, "Wait before resending OTP")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    if user.is_verified:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Already verified")

    settings = get_settings()
    otp = generate_otp()
    await redis.setex(f"otp:{email}", settings.OTP_EXPIRE_MINUTES * 60, otp)
    await redis.setex(rate_key, 60, "1")
    await send_otp_email(email, otp)
    return MessageResponse(message="OTP resent")


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    response: Response,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    """Authenticate with username/email + password."""
    identifier = body.username_or_email.strip().lower()
    result = await db.execute(
        select(User).where(
            or_(User.email == identifier, User.username == body.username_or_email)
        )
    )
    user = result.scalar_one_or_none()
    if (
        user is None
        or not user.hashed_password
        or not verify_password(body.password, user.hashed_password)
    ):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")
    if not user.is_verified:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Email not verified")

    access = create_access_token(user.id)
    refresh = create_refresh_token(user.id)
    _set_refresh_cookie(response, refresh)
    return TokenResponse(access_token=access, refresh_token=refresh)


@router.get("/google/login")
async def google_login(request: Request, next: str | None = None):
    """
    Redirect to Google OAuth consent screen.

    Important: this endpoint must be hit on the API origin directly
    (e.g. http://localhost:8001/...), not via the Vite proxy — otherwise the
    OAuth CSRF session cookie is set on the wrong host and the callback fails.
    """
    settings = get_settings()
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Google OAuth is not configured",
        )
    configure_oauth()
    if next and next.startswith("/"):
        request.session["oauth_next"] = next
    redirect_uri = settings.GOOGLE_REDIRECT_URI
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Handle Google OAuth callback and issue JWTs."""
    from fastapi.responses import RedirectResponse

    settings = get_settings()
    configure_oauth()
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"OAuth failed: {exc}") from exc

    info = token.get("userinfo") or {}
    if not info:
        resp = await oauth.google.get(
            "https://openidconnect.googleapis.com/v1/userinfo", token=token
        )
        info = resp.json()

    email = (info.get("email") or "").lower()
    google_id = info.get("sub")
    if not email or not google_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Google account missing email")

    result = await db.execute(
        select(User).where(or_(User.google_id == google_id, User.email == email))
    )
    user = result.scalar_one_or_none()
    if user is None:
        guest = await _get_guest_role(db)
        base_username = (info.get("name") or email.split("@")[0]).replace(" ", "").lower()[:60]
        username = base_username
        n = 1
        while True:
            clash = await db.execute(select(User).where(User.username == username))
            if clash.scalar_one_or_none() is None:
                break
            username = f"{base_username}{n}"
            n += 1
        user = User(
            username=username,
            email=email,
            google_id=google_id,
            is_verified=True,
            avatar_url=info.get("picture"),
            role_id=guest.id if guest else None,
        )
        db.add(user)
        await db.flush()
    else:
        user.google_id = google_id
        user.is_verified = True
        if info.get("picture"):
            user.avatar_url = info["picture"]

    from urllib.parse import quote

    access = create_access_token(user.id)
    refresh = create_refresh_token(user.id)
    next_path = request.session.pop("oauth_next", None) or "/"
    if not isinstance(next_path, str) or not next_path.startswith("/"):
        next_path = "/"
    redirect = RedirectResponse(
        url=(
            f"{settings.FRONTEND_URL}/auth/callback"
            f"?access_token={quote(access, safe='')}"
            f"&returnTo={quote(next_path, safe='/')}"
        )
    )
    _set_refresh_cookie(redirect, refresh)
    return redirect


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    request: Request,
    response: Response,
) -> TokenResponse:
    """Rotate access token from httpOnly refresh cookie."""
    token = request.cookies.get(REFRESH_COOKIE)
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "No refresh token")

    redis = await get_redis()
    payload = safe_decode_token(token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")

    jti = payload.get("jti", "")
    if jti and await redis.exists(f"blacklist:{jti}"):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token revoked")

    user_id = payload["sub"]
    access = create_access_token(user_id)
    new_refresh = create_refresh_token(user_id)
    if jti:
        settings = get_settings()
        await redis.setex(
            f"blacklist:{jti}",
            settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
            "1",
        )
    _set_refresh_cookie(response, new_refresh)
    return TokenResponse(access_token=access, refresh_token=new_refresh)


@router.post("/logout", response_model=MessageResponse)
async def logout(request: Request, response: Response) -> MessageResponse:
    """Invalidate refresh token via Redis blacklist."""
    token = request.cookies.get(REFRESH_COOKIE)
    if token:
        payload = safe_decode_token(token)
        if payload and payload.get("jti"):
            settings = get_settings()
            redis = await get_redis()
            await redis.setex(
                f"blacklist:{payload['jti']}",
                settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
                "1",
            )
    response.delete_cookie(REFRESH_COOKIE, path="/api/v1/auth")
    return MessageResponse(message="Logged out")


@router.get("/me", response_model=UserResponse)
async def me(
    user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Return the current authenticated user."""
    return user


@router.get("/my-access", response_model=AccessMapResponse)
async def my_access(
    user: Annotated[User, Depends(get_current_user)],
) -> AccessMapResponse:
    """Return module permission map for the current user."""
    raw = build_permissions_map(user)
    return AccessMapResponse(
        permissions={k: ModulePermission(**v) for k, v in raw.items()}
    )
