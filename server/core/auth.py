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
import json
import time
import urllib.request
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt, jwk

from core.config import settings
from core.supabase_client import get_supabase_client
from core.logger import debug_log

_bearer = HTTPBearer(auto_error=False)

_JWKS_CACHE: dict[str, object] = {
    "fetched_at": 0.0,
    "keys": [],
}
_JWKS_TTL_SECONDS = 3600


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


def _get_jwks_keys() -> list[dict[str, object]]:
    if not settings.SUPABASE_JWKS_URL:
        return []

    now = time.time()
    fetched_at = _JWKS_CACHE.get("fetched_at", 0.0)
    keys = _JWKS_CACHE.get("keys", [])

    if keys and isinstance(fetched_at, (int, float)):
        if now - float(fetched_at) < _JWKS_TTL_SECONDS:
            return keys  # type: ignore[return-value]

    with urllib.request.urlopen(settings.SUPABASE_JWKS_URL) as response:
        data = json.loads(response.read().decode("utf-8"))

    keys = data.get("keys", [])
    _JWKS_CACHE["keys"] = keys
    _JWKS_CACHE["fetched_at"] = now
    return keys


def _get_jwks_public_key(kid: str | None) -> str | None:
    if not kid:
        return None

    for key in _get_jwks_keys():
        if key.get("kid") == kid:
            pem = jwk.construct(key).to_pem()
            return pem.decode("utf-8") if isinstance(pem, bytes) else pem

    return None


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
        header = jwt.get_unverified_header(token)
        alg = header.get("alg")

        if alg == "HS256":
            if not settings.SUPABASE_JWT_SECRET:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="SUPABASE_JWT_SECRET is not configured."
                )
            jwt_key = settings.SUPABASE_JWT_SECRET
            jwt_algorithms = ["HS256"]
        elif alg == "ES256":
            jwt_key = _get_jwks_public_key(header.get("kid"))

            if not jwt_key:
                if settings.SUPABASE_JWT_PUBLIC_KEY:
                    jwt_key = settings.SUPABASE_JWT_PUBLIC_KEY
                else:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="SUPABASE_JWKS_URL or SUPABASE_JWT_PUBLIC_KEY is not configured."
                    )

            jwt_algorithms = ["ES256"]
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unsupported token algorithm."
            )

        payload = jwt.decode(
            token,
            jwt_key,
            algorithms=jwt_algorithms,
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