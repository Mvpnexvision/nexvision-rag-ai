"""
modules/business_lines/services/business_lines.py
==================================================
Business Lines Service

Responsibility: Fetch all business lines with the count of companies
associated to each line.

Business lines are stored as a field on the `companies` table.
The query groups companies by their `business_line` value and counts
how many companies belong to each line.
"""

from core.config import settings
from core.supabase_client import get_supabase_client

MOCK_BUSINESS_LINES = [
    {"name": "Logistics Network", "company_count": 1},
    {"name": "Operations", "company_count": 2},
    {"name": "Sales & Marketing", "company_count": 2},
    {"name": "Warehouse", "company_count": 1},
]


async def get_all_business_lines() -> list[dict]:
    """
    Fetch all business lines with their associated company counts.

    Queries the `companies` table, groups by `business_line`, and counts
    the number of companies per line. Results are sorted alphabetically
    by business line name.

    Returns:
        list of dicts with keys:
            name: str          — business line label
            company_count: int — number of companies in this line

    Example:
        [
            {"name": "Logistics Network", "company_count": 1},
            {"name": "Operations",        "company_count": 2},
            {"name": "Sales & Marketing", "company_count": 2},
            {"name": "Warehouse",         "company_count": 1},
        ]
    """
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
        return MOCK_BUSINESS_LINES
    sb = get_supabase_client()

    try:
        # Fetch all companies and count by business_line in Python
        # (Supabase PostgREST does not support GROUP BY natively)
        result = (
            sb.table("companies")
            .select("business_line")
            .execute()
        )

        # Tally counts per business line
        counts: dict[str, int] = {}
        if result.data:
            for row in result.data:
                line = row.get("business_line") or "Unknown"
                counts[line] = counts.get(line, 0) + 1

        # Sort alphabetically and build response list
        business_lines = [
            {"name": line.title(), "company_count": count}
            for line, count in sorted(counts.items())
        ]


        return business_lines

    except Exception as e:
        raise Exception(f"Failed to fetch business lines: {e}")