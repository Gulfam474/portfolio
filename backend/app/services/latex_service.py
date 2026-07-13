"""LaTeX CV generation from profile data via Jinja2 + tectonic/pdflatex."""

from __future__ import annotations

import logging
import shutil
import subprocess
import tempfile
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.models.profile import (
    Education,
    Experience,
    PersonalInfo,
    Project,
    Skill,
)
from app.models.user import User

logger = logging.getLogger(__name__)

TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "templates" / "latex"
jinja_env = Environment(
    loader=FileSystemLoader(str(TEMPLATE_DIR)),
    autoescape=select_autoescape(enabled_extensions=()),
)


def _latex_escape(value: str) -> str:
    """Escape LaTeX special characters."""
    replacements = {
        "\\": r"\textbackslash{}",
        "&": r"\&",
        "%": r"\%",
        "$": r"\$",
        "#": r"\#",
        "_": r"\_",
        "{": r"\{",
        "}": r"\}",
        "~": r"\textasciitilde{}",
        "^": r"\textasciicircum{}",
    }
    out = value or ""
    for src, dst in replacements.items():
        out = out.replace(src, dst)
    return out


jinja_env.filters["latex_escape"] = _latex_escape


async def generate_cv_pdf(db: AsyncSession, user_id: int) -> Path:
    """
    Render profile sections into LaTeX and compile to PDF.

    Returns path to the generated PDF file.
    """
    settings = get_settings()
    result = await db.execute(
        select(User)
        .options(
            selectinload(User.personal_info),
            selectinload(User.education),
            selectinload(User.experience),
            selectinload(User.skills),
            selectinload(User.projects),
        )
        .where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise ValueError("User not found")

    personal: PersonalInfo | None = user.personal_info
    template = jinja_env.get_template("cv_template.tex.jinja")
    tex_source = template.render(
        personal=personal,
        education=sorted(user.education, key=lambda e: e.sort_order),
        experience=sorted(user.experience, key=lambda e: e.sort_order),
        skills=sorted(user.skills, key=lambda s: s.sort_order),
        projects=sorted(user.projects, key=lambda p: p.sort_order),
    )

    out_dir = Path(settings.LATEX_OUTPUT_DIR)
    out_dir.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        tex_file = tmp_path / "cv.tex"
        tex_file.write_text(tex_source, encoding="utf-8")
        _compile_latex(tmp_path, tex_file)
        pdf_src = tmp_path / "cv.pdf"
        if not pdf_src.exists():
            raise RuntimeError("LaTeX compilation failed — PDF not produced")
        dest = out_dir / f"cv_user_{user_id}.pdf"
        shutil.copy2(pdf_src, dest)
        return dest


def _compile_latex(workdir: Path, tex_file: Path) -> None:
    """Compile with tectonic if available, else pdflatex."""
    tectonic = shutil.which("tectonic")
    if tectonic:
        subprocess.run(
            [tectonic, str(tex_file)],
            cwd=workdir,
            check=True,
            capture_output=True,
        )
        return

    pdflatex = shutil.which("pdflatex")
    if not pdflatex:
        raise RuntimeError(
            "Neither tectonic nor pdflatex is installed. "
            "Install texlive or tectonic to enable LaTeX CV export."
        )
    for _ in range(2):
        subprocess.run(
            [pdflatex, "-interaction=nonstopmode", str(tex_file.name)],
            cwd=workdir,
            check=True,
            capture_output=True,
        )
