"""
core/auth.py
============
FastAPI dependency for JWT verification via Supabase Auth.

Two modes:
  Normal mode  — verifies Bearer token, loads user from public.users.
  Bypass mode  — skips JWT entirely, loads user by DEV_BYPASS_USER_ID.

Import and inject:
    from core.auth import get_current_user, CurrentUser
    from fastapi import Depends

    @router.get("/example")
    def example(current_user: CurrentUser = Depends(get_current_user)):
        ...
"""

from dataclasses import dataclass
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from core.config import settings
from core.supabase_client import get_supabase_client
from core.logger import debug_log

_bearer = HTTPBearer(auto_error=False)


@dataclass
class CurrentUser:
    id: str
    company_id: str
    name: str
    email: str
    role: str
    status: str


def _load_user_from_db(user_id: str) -> CurrentUser:
    sb = get_supabase_client()
    result = sb.table("users").select("*").eq("id", user_id).single().execute()

    if not result.data:
        debug_log("AUTH", f"User not found in users table: {user_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not found."
        )

    user = result.data
    debug_log("AUTH", f"User loaded: {user['email']} | role={user['role']} | status={user['status']}")

    if user["status"] != "active":
        debug_log("AUTH", f"User inactive: {user['email']}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account inactive."
        )

    return CurrentUser(
        id=user["id"],
        company_id=user["company_id"],
        name=user["name"],
        email=user["email"],
        role=user["role"],
        status=user["status"],
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> CurrentUser:
    # ------------------------------------------------------------------
    # BYPASS MODE — development only, never set in production
    # ------------------------------------------------------------------
    if settings.DEV_BYPASS_USER_ID:
        debug_log("AUTH", f"BYPASS ACTIVE — skipping JWT, loading user: {settings.DEV_BYPASS_USER_ID}")
        return _load_user_from_db(settings.DEV_BYPASS_USER_ID)

    # ------------------------------------------------------------------
    # NORMAL MODE
    # ------------------------------------------------------------------
    if not credentials:
        debug_log("AUTH", "No Authorization header present")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing."
        )

    token = credentials.credentials
    debug_log("AUTH", f"Token received: {token[:20]}...")

    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        debug_log("AUTH", "JWT decoded successfully")
    except JWTError as e:
        debug_log("AUTH", f"JWT decode failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token."
        )

    user_id: str | None = payload.get("sub")
    if not user_id:
        debug_log("AUTH", "JWT missing sub claim")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload."
        )

    debug_log("AUTH", f"JWT sub: {user_id}")
    return _load_user_from_db(user_id)