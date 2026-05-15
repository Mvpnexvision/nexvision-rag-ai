"""
modules/users/router.py
========================
Users Module — FastAPI Router

Implements user management endpoints for the Users page.

Endpoints:
    GET   /users              Return all users across the system
    POST  /users              Create a new user
    PATCH /users/{user_id}    Update an existing user

All endpoints visible in Swagger UI at: http://localhost:8000/docs
"""

from fastapi import APIRouter, HTTPException

from app.users.schemas import (
    UserListResponse,
    UserRecord,
    CreateUserRequest,
    CreateUserResponse,
    UpdateUserRequest,
    UpdateUserResponse,
)
from app.users.services.users import (
    get_all_users,
    create_user,
    update_user,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# GET /users
# ---------------------------------------------------------------------------

@router.get(
    "/",
    response_model=UserListResponse,
    summary="Get all users",
    description=(
        "Returns all users across the system.\n\n"
        "Each user includes their company name and business line "
        "(joined from the `companies` table).\n\n"
        "The `name` column is split into `first_name` and `last_name` "
        "for the frontend edit form."
    ),
)
async def get_users():
    """
    Fetch all users (global list, not company-scoped).

    **Response Example:**
    ```json
    {
        "users": [
            {
                "id": "uuid-1",
                "first_name": "John",
                "last_name": "Smith",
                "email": "john@techcorp.com",
                "company_id": "uuid-c1",
                "company_name": "NexVision Logistics",
                "business_line": "logistics",
                "role": "admin",
                "status": "active",
                "created_at": "2026-05-14T10:00:00+00:00"
            }
        ]
    }
    ```

    **Errors:**
    - `500` — Database query failed
    """
    try:
        data = await get_all_users()

        users = [
            UserRecord(
                id=item["id"],
                first_name=item["first_name"],
                last_name=item["last_name"],
                email=item["email"],
                company_id=item.get("company_id"),
                company_name=item.get("company_name"),
                business_line=item.get("business_line"),
                role=item["role"],
                status=item["status"],
                created_at=item.get("created_at"),
            )
            for item in data
        ]

        return UserListResponse(users=users)

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch users: {str(exc)}",
        )


# ---------------------------------------------------------------------------
# POST /users
# ---------------------------------------------------------------------------

@router.post(
    "/",
    response_model=CreateUserResponse,
    status_code=201,
    summary="Create a new user",
    description=(
        "Creates a new user via Supabase Auth signup.\n\n"
        "Flow: `sign_up()` → Auth trigger fires → `users` row auto-created with correct UUID.\n\n"
        "`first_name` and `last_name` are joined into a single "
        "`name` column in the database via the trigger metadata."
    ),
)
async def create_user_endpoint(body: CreateUserRequest):
    """
    Create a new user.

    **Request Body Example:**
    ```json
    {
        "first_name": "Jane",
        "last_name": "Doe",
        "email": "jane@example.com",
        "company_id": "uuid-c1",
        "role": "admin",
        "status": "active"
    }
    ```

    **Errors:**
    - `400` — Validation error (invalid role, status, or missing fields)
    - `500` — Database insert failed (e.g. duplicate email)
    """
    # Validate role
    if body.role not in ("superadmin", "admin"):
        raise HTTPException(
            status_code=400,
            detail="role must be 'superadmin' or 'admin'",
        )

    # Validate status
    if body.status not in ("active", "inactive"):
        raise HTTPException(
            status_code=400,
            detail="status must be 'active' or 'inactive'",
        )

    try:
        result = await create_user(
            first_name=body.first_name,
            last_name=body.last_name,
            email=str(body.email),
            password=body.password,
            company_id=body.company_id,
            role=body.role,
            status=body.status,
        )

        return CreateUserResponse(**result)

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create user: {str(exc)}",
        )


# ---------------------------------------------------------------------------
# PATCH /users/{user_id}
# ---------------------------------------------------------------------------

@router.patch(
    "/{user_id}",
    response_model=UpdateUserResponse,
    summary="Update an existing user",
    description=(
        "Partially updates a user by ID. Only fields included in the "
        "request body are updated — all others remain unchanged.\n\n"
        "Editable fields: `first_name`, `last_name`, `email`, "
        "`company_id`, `role`, `status`.\n\n"
        "If only `first_name` or only `last_name` is provided, the "
        "existing other half is preserved when writing to the `name` column."
    ),
)
async def update_user_endpoint(user_id: str, body: UpdateUserRequest):
    """
    Update a user by ID.

    **Path Parameter:**
    - `user_id` — UUID of the user to update

    **Request Body Example (partial update):**
    ```json
    {
        "first_name": "Jonathan",
        "status": "inactive"
    }
    ```

    **Errors:**
    - `400` — No fields provided, or invalid role/status value
    - `404` — User not found
    - `500` — Database update failed
    """
    # Validate role if provided
    if body.role is not None and body.role not in ("superadmin", "admin"):
        raise HTTPException(
            status_code=400,
            detail="role must be 'superadmin' or 'admin'",
        )

    # Validate status if provided
    if body.status is not None and body.status not in ("active", "inactive"):
        raise HTTPException(
            status_code=400,
            detail="status must be 'active' or 'inactive'",
        )

    # Ensure at least one field is provided
    if not any([
        body.first_name, body.last_name, body.email,
        body.company_id, body.role, body.status,
    ]):
        raise HTTPException(
            status_code=400,
            detail="At least one field must be provided to update",
        )

    try:
        result = await update_user(
            user_id=user_id,
            first_name=body.first_name,
            last_name=body.last_name,
            email=str(body.email) if body.email else None,
            company_id=body.company_id,
            role=body.role,
            status=body.status,
        )

        return UpdateUserResponse(**result)

    except Exception as exc:
        # Surface not-found as 404
        if "not found" in str(exc).lower():
            raise HTTPException(status_code=404, detail=str(exc))
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update user: {str(exc)}",
        )