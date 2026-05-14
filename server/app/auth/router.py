"""
app/auth/router.py
==================
GET /auth/me - returns current authenticated user profile.
"""

from fastapi import APIRouter, Depends
from core.auth import CurrentUser, get_current_user

router = APIRouter()


@router.get("/me", summary="Get current user profile")
def me(current_user: CurrentUser = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "company_id": current_user.company_id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "status": current_user.status,
    }
