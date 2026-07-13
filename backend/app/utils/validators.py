"""Input validators and sanitizers."""

from __future__ import annotations

import bleach

ALLOWED_TAGS = [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "h1",
    "h2",
    "h3",
    "h4",
    "ul",
    "ol",
    "li",
    "a",
    "img",
    "blockquote",
    "code",
    "pre",
    "span",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "colgroup",
    "col",
]
ALLOWED_ATTRIBUTES = {
    "a": ["href", "title", "target", "rel"],
    "img": ["src", "alt", "title", "width", "height"],
    "table": ["style"],
    "col": ["style", "width", "span"],
    "colgroup": ["span"],
    "td": ["colspan", "rowspan", "colwidth", "style"],
    "th": ["colspan", "rowspan", "colwidth", "style"],
    "*": ["class"],
}


def sanitize_html(content: str) -> str:
    """Sanitize rich HTML from TipTap before persistence."""
    return bleach.clean(
        content,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRIBUTES,
        strip=True,
    )
