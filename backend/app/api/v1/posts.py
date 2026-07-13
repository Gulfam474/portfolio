"""Social posts: create, feed, like, comment."""

from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db import get_db
from app.core.permissions import get_current_user, get_optional_user, require_permission
from app.models.post import Post, PostComment, PostLike
from app.models.user import User
from app.schemas.post import (
    AuthorBrief,
    CommentCreate,
    CommentResponse,
    PostListResponse,
    PostResponse,
    PostUpdate,
)
from app.services.storage_service import save_upload
from app.utils.validators import sanitize_html

router = APIRouter(prefix="/posts", tags=["posts"])


def _to_response(post: Post, liked_by_me: bool = False) -> PostResponse:
    return PostResponse(
        id=post.id,
        title=post.title,
        content=post.content,
        image_url=post.image_url,
        author=AuthorBrief(
            id=post.author.id,
            username=post.author.username,
            avatar_url=post.author.avatar_url,
        ),
        like_count=len(post.likes),
        comment_count=len(post.comments),
        liked_by_me=liked_by_me,
        created_at=post.created_at,
        updated_at=post.updated_at,
    )


@router.post("/", response_model=PostResponse, status_code=201)
async def create_post(
    user: Annotated[User, Depends(require_permission("posts", "edit"))],
    db: Annotated[AsyncSession, Depends(get_db)],
    title: str = Form(...),
    content: str = Form(...),
    image: Optional[UploadFile] = File(None),
):
    """Create a post with optional image (multipart)."""
    image_url = None
    if image and image.filename:
        _, image_url = await save_upload(image, "posts")
    post = Post(
        author_id=user.id,
        title=title.strip(),
        content=sanitize_html(content),
        image_url=image_url,
    )
    db.add(post)
    await db.flush()
    result = await db.execute(
        select(Post)
        .options(
            selectinload(Post.author),
            selectinload(Post.likes),
            selectinload(Post.comments),
        )
        .where(Post.id == post.id)
    )
    return _to_response(result.scalar_one())


@router.get("/", response_model=PostListResponse)
async def list_posts(
    db: Annotated[AsyncSession, Depends(get_db)],
    current: Annotated[User | None, Depends(get_optional_user)] = None,
    page: int = 1,
    page_size: int = 10,
):
    """Paginated feed, newest first."""
    page = max(1, page)
    page_size = min(50, max(1, page_size))
    total = await db.scalar(select(func.count()).select_from(Post)) or 0
    result = await db.execute(
        select(Post)
        .options(
            selectinload(Post.author),
            selectinload(Post.likes),
            selectinload(Post.comments),
        )
        .order_by(Post.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    posts = list(result.scalars().all())
    items = []
    for p in posts:
        liked = bool(current and any(like.user_id == current.id for like in p.likes))
        items.append(_to_response(p, liked))
    return PostListResponse(items=items, total=total, page=page, page_size=page_size)


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current: Annotated[User | None, Depends(get_optional_user)] = None,
):
    result = await db.execute(
        select(Post)
        .options(
            selectinload(Post.author),
            selectinload(Post.likes),
            selectinload(Post.comments),
        )
        .where(Post.id == post_id)
    )
    post = result.scalar_one_or_none()
    if post is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    liked = bool(current and any(l.user_id == current.id for l in post.likes))
    return _to_response(post, liked)


@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: int,
    body: PostUpdate,
    user: Annotated[User, Depends(require_permission("posts", "edit"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(Post)
        .options(
            selectinload(Post.author),
            selectinload(Post.likes),
            selectinload(Post.comments),
        )
        .where(Post.id == post_id)
    )
    post = result.scalar_one_or_none()
    if post is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    is_admin = user.role and user.role.name in {"owner", "admin"}
    if post.author_id != user.id and not is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your post")
    if body.title is not None:
        post.title = body.title
    if body.content is not None:
        post.content = sanitize_html(body.content)
    await db.flush()
    await db.refresh(post)
    return _to_response(post)


@router.delete("/{post_id}", status_code=204)
async def delete_post(
    post_id: int,
    user: Annotated[User, Depends(require_permission("posts", "delete"))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if post is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    is_admin = user.role and user.role.name in {"owner", "admin"}
    if post.author_id != user.id and not is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your post")
    await db.delete(post)


@router.post("/{post_id}/like", status_code=204)
async def like_post(
    post_id: int,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(Post).where(Post.id == post_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    existing = await db.execute(
        select(PostLike).where(PostLike.post_id == post_id, PostLike.user_id == user.id)
    )
    if existing.scalar_one_or_none() is None:
        db.add(PostLike(post_id=post_id, user_id=user.id))


@router.delete("/{post_id}/like", status_code=204)
async def unlike_post(
    post_id: int,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(PostLike).where(PostLike.post_id == post_id, PostLike.user_id == user.id)
    )
    like = result.scalar_one_or_none()
    if like:
        await db.delete(like)


@router.get("/{post_id}/comments", response_model=list[CommentResponse])
async def list_comments(post_id: int, db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(
        select(PostComment)
        .options(selectinload(PostComment.user))
        .where(PostComment.post_id == post_id)
        .order_by(PostComment.created_at.asc())
    )
    comments = list(result.scalars().all())
    return [
        CommentResponse(
            id=c.id,
            content=c.content,
            user=AuthorBrief(
                id=c.user.id, username=c.user.username, avatar_url=c.user.avatar_url
            ),
            created_at=c.created_at,
        )
        for c in comments
    ]


@router.post("/{post_id}/comments", response_model=CommentResponse, status_code=201)
async def add_comment(
    post_id: int,
    body: CommentCreate,
    user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(Post).where(Post.id == post_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    comment = PostComment(
        post_id=post_id,
        user_id=user.id,
        content=sanitize_html(body.content),
    )
    db.add(comment)
    await db.flush()
    await db.refresh(comment)
    return CommentResponse(
        id=comment.id,
        content=comment.content,
        user=AuthorBrief(id=user.id, username=user.username, avatar_url=user.avatar_url),
        created_at=comment.created_at,
    )
