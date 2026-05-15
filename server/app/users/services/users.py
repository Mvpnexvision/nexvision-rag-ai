"""
modules/users/services/users.py
================================
Users Service

Responsibility: Fetch, create, and update users.

Name handling:
    The DB stores a single `name` column.
    This service splits name → (first_name, last_name) on read,
    and joins (first_name, last_name) → name on write.
"""

from core.supabase_client import get_supabase_client


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _split_name(name: str) -> tuple[str, str]:
    """
    Split a full name string into (first_name, last_name).
    If there is no space, last_name will be an empty string.

    Examples:
        "John Smith"      → ("John", "Smith")
        "Jane"            → ("Jane", "")
        "Mary Jane Smith" → ("Mary", "Jane Smith")
    """
    parts = (name or "").strip().split(" ", 1)
    first = parts[0] if len(parts) > 0 else ""
    last = parts[1] if len(parts) > 1 else ""
    return first, last


def _join_name(first_name: str, last_name: str) -> str:
    """
    Join first_name and last_name into a single name string.

    Examples:
        ("John", "Smith") → "John Smith"
        ("Jane", "")      → "Jane"
    """
    return f"{first_name} {last_name}".strip()


def _format_user(row: dict, company_map: dict) -> dict:
    """
    Map a raw DB user row to the response shape.
    Splits name into first_name + last_name.
    Injects company_name and business_line from company_map.
    """
    first_name, last_name = _split_name(row.get("name", ""))
    company_id = row.get("company_id")
    company = company_map.get(company_id, {})

    return {
        "id": row.get("id"),
        "first_name": first_name,
        "last_name": last_name,
        "email": row.get("email"),
        "company_id": company_id,
        "company_name": company.get("company_name"),
        "business_line": company.get("business_line"),
        "role": row.get("role"),
        "status": row.get("status"),
        "created_at": str(row.get("created_at")) if row.get("created_at") else None,
    }


# ---------------------------------------------------------------------------
# GET all users
# ---------------------------------------------------------------------------

async def get_all_users() -> list[dict]:
    """
    Fetch all users across the system (global, not company-scoped).

    Joins with the `companies` table to include company_name and
    business_line in each user record.

    Returns:
        list of dicts matching UserRecord schema.
    """
    sb = get_supabase_client()

    try:
        # Fetch all users
        users_result = (
            sb.table("users")
            .select("id, name, email, company_id, role, status, created_at")
            .order("created_at", desc=True)
            .execute()
        )

        if not users_result.data:
            return []

        # Collect unique company_ids for a single companies lookup
        company_ids = list({
            row["company_id"]
            for row in users_result.data
            if row.get("company_id")
        })

        company_map: dict = {}
        if company_ids:
            companies_result = (
                sb.table("companies")
                .select("id, company_name, business_line")
                .in_("id", company_ids)
                .execute()
            )
            if companies_result.data:
                company_map = {c["id"]: c for c in companies_result.data}

        return [_format_user(row, company_map) for row in users_result.data]

    except Exception as e:
        raise Exception(f"Failed to fetch users: {e}")


# ---------------------------------------------------------------------------
# POST — create user
# ---------------------------------------------------------------------------

async def create_user(
    first_name: str,
    last_name: str,
    email: str,
    password: str,
    company_id: str,
    role: str,
    status: str = "active",
) -> dict:
    """
    Create a new user via Supabase Auth signup.

    Flow:
        1. Call supabase.auth.sign_up() with email, password, and user
           metadata (name, company_id, role).
        2. Supabase fires the `on_auth_user_created` trigger which
           automatically inserts the row into the `users` table using
           the Auth UUID as the primary key.
        3. Fetch the newly created users row to return full details.

    Args:
        first_name: User's first name.
        last_name:  User's last name.
        email:      User's email address (must be unique in Auth).
        password:   Password set by the admin for the new user.
        company_id: UUID of the company the user belongs to.
        role:       'superadmin' or 'admin'.
        status:     'active' or 'inactive' (default: 'active').

    Returns:
        dict matching CreateUserResponse schema.

    Raises:
        Exception: If email already exists or Auth signup fails.
    """
    sb = get_supabase_client()

    try:
        # Step 1: Sign up via Supabase Auth
        # Metadata is picked up by the on_auth_user_created trigger
        auth_result = sb.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": {
                    "name": _join_name(first_name, last_name),
                    "company_id": company_id,
                    "role": role,
                }
            }
        })

        if not auth_result.user:
            raise Exception("Auth signup returned no user")

        auth_user_id = auth_result.user.id

        # Step 2: Update status on the users row created by the trigger
        # (trigger defaults status to 'active'; update if different)
        if status != "active":
            sb.table("users").update({"status": status}).eq("id", auth_user_id).execute()

        # Step 3: Fetch the created users row for the response
        user_result = (
            sb.table("users")
            .select("id, name, email, company_id, role, status, created_at")
            .eq("id", auth_user_id)
            .single()
            .execute()
        )

        if not user_result.data:
            raise Exception("User was created in Auth but not found in users table")

        row = user_result.data
        fn, ln = _split_name(row.get("name", ""))

        return {
            "id": row.get("id"),
            "first_name": fn,
            "last_name": ln,
            "email": row.get("email"),
            "company_id": row.get("company_id"),
            "role": row.get("role"),
            "status": row.get("status"),
            "created_at": str(row.get("created_at")) if row.get("created_at") else None,
        }

    except Exception as e:
        raise Exception(f"Failed to create user: {e}")


# ---------------------------------------------------------------------------
# PATCH — update user
# ---------------------------------------------------------------------------

async def update_user(
    user_id: str,
    first_name: str | None = None,
    last_name: str | None = None,
    email: str | None = None,
    company_id: str | None = None,
    role: str | None = None,
    status: str | None = None,
) -> dict:
    """
    Update an existing user by ID. Only provided fields are updated.

    If first_name or last_name is provided, the existing `name` is
    fetched first so the unchanged half is preserved.

    Args:
        user_id:    UUID of the user to update.
        first_name: New first name (optional).
        last_name:  New last name (optional).
        email:      New email (optional).
        company_id: New company UUID (optional).
        role:       New role (optional).
        status:     New status (optional).

    Returns:
        dict matching UpdateUserResponse schema.

    Raises:
        Exception: If user not found or DB update fails.
    """
    sb = get_supabase_client()

    try:
        # Build patch payload — only include fields that were provided
        payload: dict = {}

        # Handle name: fetch current name if only one half is changing
        if first_name is not None or last_name is not None:
            current = (
                sb.table("users")
                .select("name")
                .eq("id", user_id)
                .single()
                .execute()
            )
            if not current.data:
                raise Exception(f"User {user_id} not found")

            cur_first, cur_last = _split_name(current.data.get("name", ""))
            new_first = first_name if first_name is not None else cur_first
            new_last = last_name if last_name is not None else cur_last
            payload["name"] = _join_name(new_first, new_last)

        if email is not None:
            payload["email"] = email
        if company_id is not None:
            payload["company_id"] = company_id
        if role is not None:
            payload["role"] = role
        if status is not None:
            payload["status"] = status

        if not payload:
            raise Exception("No fields provided to update")

        result = (
            sb.table("users")
            .update(payload)
            .eq("id", user_id)
            .execute()
        )

        if not result.data:
            raise Exception(f"User {user_id} not found or update failed")

        row = result.data[0]
        fn, ln = _split_name(row.get("name", ""))

        return {
            "id": row.get("id"),
            "first_name": fn,
            "last_name": ln,
            "email": row.get("email"),
            "company_id": row.get("company_id"),
            "role": row.get("role"),
            "status": row.get("status"),
        }

    except Exception as e:
        raise Exception(f"Failed to update user: {e}")