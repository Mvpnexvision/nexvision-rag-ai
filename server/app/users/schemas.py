"""
modules/users/schemas.py
=========================
Users Module — Pydantic Schemas

Defines request/response models for the users endpoints.

Note on name handling:
    The `users` table stores a single `name` column.
    The frontend edit form uses `first_name` + `last_name` separately.
    - GET responses split `name` into `first_name` + `last_name`
      (split on first space; if no space, all goes to `first_name`)
    - POST/PATCH requests accept `first_name` + `last_name`
      and join them into `name` before writing to the DB.
"""

from typing import Optional
from pydantic import BaseModel, EmailStr


# ---------------------------------------------------------------------------
# Shared user record returned in list and detail responses
# ---------------------------------------------------------------------------

class UserRecord(BaseModel):
    """A single user record as returned by GET /users."""
    id: str
    first_name: str
    last_name: str
    email: str
    company_id: Optional[str]
    company_name: Optional[str]       # joined from companies table
    business_line: Optional[str]      # joined from companies table
    role: str
    status: str
    created_at: Optional[str]


class UserListResponse(BaseModel):
    """Response model for GET /users."""
    users: list[UserRecord]


# ---------------------------------------------------------------------------
# Create user
# ---------------------------------------------------------------------------

class CreateUserRequest(BaseModel):
    """Request body for POST /users."""
    first_name: str
    last_name: str
    email: EmailStr
    password: str                     # used for Supabase Auth signup
    company_id: str
    role: str                         # 'superadmin' | 'admin'
    status: str = "active"            # 'active' | 'inactive'


class CreateUserResponse(BaseModel):
    """Response model for POST /users."""
    id: str
    first_name: str
    last_name: str
    email: str
    company_id: str
    role: str
    status: str
    created_at: Optional[str]


# ---------------------------------------------------------------------------
# Edit user
# ---------------------------------------------------------------------------

class UpdateUserRequest(BaseModel):
    """Request body for PATCH /users/{user_id}. All fields optional."""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    company_id: Optional[str] = None
    role: Optional[str] = None        # 'superadmin' | 'admin'
    status: Optional[str] = None      # 'active' | 'inactive'


class UpdateUserResponse(BaseModel):
    """Response model for PATCH /users/{user_id}."""
    id: str
    first_name: str
    last_name: str
    email: str
    company_id: Optional[str]
    role: str
    status: str