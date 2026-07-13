"""Email delivery service for OTP and notifications."""

from __future__ import annotations

import logging
from pathlib import Path

import aiosmtplib
from email.message import EmailMessage
from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.core.config import get_settings

logger = logging.getLogger(__name__)

TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "templates" / "email"
jinja_env = Environment(
    loader=FileSystemLoader(str(TEMPLATE_DIR)),
    autoescape=select_autoescape(["html", "xml"]),
)


async def send_otp_email(to_email: str, otp: str) -> None:
    """Render and send an OTP verification email (logs OTP in dev if SMTP unset)."""
    settings = get_settings()
    template = jinja_env.get_template("otp_email.html")
    html = template.render(otp=otp, expire_minutes=settings.OTP_EXPIRE_MINUTES)

    if not settings.SMTP_HOST:
        logger.warning("SMTP not configured — OTP for %s: %s", to_email, otp)
        print(f"[DEV OTP] {to_email}: {otp}")
        return

    message = EmailMessage()
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = to_email
    message["Subject"] = "Your verification code"
    message.set_content(f"Your OTP is {otp}. It expires in {settings.OTP_EXPIRE_MINUTES} minutes.")
    message.add_alternative(html, subtype="html")

    await aiosmtplib.send(
        message,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER or None,
        password=settings.SMTP_PASSWORD or None,
        start_tls=True,
    )
