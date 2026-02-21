from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional

from app.database import get_db
from app.models.community import CommunityPost, Comment
from app.models.user import User
from app.schemas.community import PostCreate, PostOut, PostListOut, CommentCreate, CommentOut
from app.routers.auth import get_current_user

router = APIRouter(prefix="/community", tags=["community"])

VALID_CATEGORIES = {"flood_report", "road_closure", "weather_warning"}


@router.get("/posts", response_model=list[PostListOut])
async def list_posts(
    category: Optional[str] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """List community posts, optionally filtered by category."""
    query = select(CommunityPost).order_by(CommunityPost.created_at.desc()).limit(limit)
    if category:
        query = query.where(CommunityPost.category == category)

    result = await db.execute(query)
    posts = result.scalars().all()

    # Attach comment counts
    output = []
    for post in posts:
        count_result = await db.execute(
            select(func.count()).where(Comment.post_id == post.id)
        )
        comment_count = count_result.scalar() or 0
        output.append(PostListOut(
            id=post.id,
            author_username=post.author_username,
            category=post.category,
            title=post.title,
            body=post.body,
            location_name=post.location_name,
            created_at=post.created_at,
            comment_count=comment_count,
        ))
    return output


@router.post("/posts", response_model=PostOut, status_code=201)
async def create_post(
    body: PostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Category must be one of {VALID_CATEGORIES}")

    post = CommunityPost(
        author_id=current_user.id,
        author_username=current_user.username,
        **body.model_dump(),
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return post


@router.get("/posts/{post_id}", response_model=PostOut)
async def get_post(post_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CommunityPost).where(CommunityPost.id == post_id)
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Load comments
    comments_result = await db.execute(
        select(Comment).where(Comment.post_id == post_id).order_by(Comment.created_at)
    )
    post.comments = list(comments_result.scalars().all())
    return post


@router.delete("/posts/{post_id}", status_code=204)
async def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(CommunityPost).where(CommunityPost.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your post")
    await db.delete(post)
    await db.commit()


@router.post("/posts/{post_id}/comments", response_model=CommentOut, status_code=201)
async def add_comment(
    post_id: int,
    body: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(CommunityPost).where(CommunityPost.id == post_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Post not found")

    comment = Comment(
        post_id=post_id,
        author_id=current_user.id,
        author_username=current_user.username,
        body=body.body,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return comment
