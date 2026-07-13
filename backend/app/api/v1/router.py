"""Aggregate API v1 routers."""

from fastapi import APIRouter

from app.api.v1 import admin, auth, cv, posts, profile, users

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(profile.router)
api_router.include_router(cv.router)
api_router.include_router(posts.router)
api_router.include_router(admin.router)
