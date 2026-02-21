from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class CommentCreate(BaseModel):
    body: str


class CommentOut(BaseModel):
    id: int
    author_username: str
    body: str
    created_at: datetime

    class Config:
        from_attributes = True


class PostCreate(BaseModel):
    category: str
    title: str
    body: str
    location_name: str = ""
    lat: Optional[float] = None
    lng: Optional[float] = None


class PostOut(BaseModel):
    id: int
    author_username: str
    category: str
    title: str
    body: str
    location_name: str
    lat: Optional[float]
    lng: Optional[float]
    created_at: datetime
    comments: list[CommentOut] = []

    class Config:
        from_attributes = True


class PostListOut(BaseModel):
    id: int
    author_username: str
    category: str
    title: str
    body: str
    location_name: str
    created_at: datetime
    comment_count: int = 0

    class Config:
        from_attributes = True
