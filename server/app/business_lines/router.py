"""
modules/business_lines/router.py
=================================
Business Lines Module — FastAPI Router

Implements the business lines endpoint that returns all business lines
with the count of companies associated to each.

Endpoints:
    GET /business-lines    Return all business lines with company counts

All endpoints visible in Swagger UI at: http://localhost:8000/docs
"""

from fastapi import APIRouter, HTTPException

from app.business_lines.schemas import (
    BusinessLineListResponse,
    BusinessLineRecord,
)
from app.business_lines.services.business_lines import get_all_business_lines

router = APIRouter()


# ---------------------------------------------------------------------------
# GET /business-lines
# ---------------------------------------------------------------------------

@router.get(
    "/",
    response_model=BusinessLineListResponse,
    summary="Get all business lines",
    description=(
        "Returns all business lines with the number of companies in each line.\n\n"
        "Business lines are derived from the `business_line` field on the "
        "`companies` table.\n\n"
        "Results are sorted alphabetically by business line name."
    ),
)
async def get_business_lines():
    """
    Fetch all business lines with their company counts.

    Returns a list of business lines, each with the number of companies
    that belong to that line.

    **Response Example:**
    ```json
    {
        "business_lines": [
            {"name": "Logistics Network", "company_count": 1},
            {"name": "Operations",        "company_count": 2},
            {"name": "Sales & Marketing", "company_count": 2},
            {"name": "Warehouse",         "company_count": 1}
        ]
    }
    ```

    **Errors:**
    - `500` — Database query failed
    """
    try:
        data = await get_all_business_lines()

        business_lines = [
            BusinessLineRecord(
                name=item["name"],
                company_count=item["company_count"],
            )
            for item in data
        ]

        return BusinessLineListResponse(business_lines=business_lines)

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch business lines: {str(exc)}",
        )