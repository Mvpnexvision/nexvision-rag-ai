from fastapi import APIRouter, Path, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from app.company.schemas import CompanyResponse, CompanyCreate, CompanyUpdate, CompanyListResponse
from app.company.services import (
    get_all_companies_with_details,
    get_company_by_id,
    create_company,
    update_company,
    get_company_users,
    get_company_ai_activity,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas for company detail endpoints
# ---------------------------------------------------------------------------

class CompanyUserItem(BaseModel):
    id: str
    name: str
    email: str
    role: str
    status: str


class CompanyUsersResponse(BaseModel):
    company_id: str
    users: list[CompanyUserItem]


class AIActivityItem(BaseModel):
    id: str
    question: str
    created_at: Optional[str]


class CompanyAIActivityResponse(BaseModel):
    company_id: str
    activity: list[AIActivityItem]


# ---------------------------------------------------------------------------
# GET /companies
# ---------------------------------------------------------------------------

@router.get("", response_model=CompanyListResponse)
async def list_companies():
    """Get all companies with full details"""
    try:
        companies = await get_all_companies_with_details()
        return CompanyListResponse(companies=companies)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# GET /companies/{company_id}
# ---------------------------------------------------------------------------

@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(company_id: str = Path(..., description="Company ID")):
    """Get single company details"""
    try:
        company = await get_company_by_id(company_id)
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        return company
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# POST /companies
# ---------------------------------------------------------------------------

@router.post("", response_model=CompanyResponse)
async def create_new_company(data: CompanyCreate):
    """Create a new company"""
    try:
        company = await create_company(data.name, data.business_line)
        return company
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# PATCH /companies/{company_id}
# ---------------------------------------------------------------------------

@router.patch("/{company_id}", response_model=CompanyResponse)
async def update_existing_company(
    company_id: str = Path(..., description="Company ID"),
    data: CompanyUpdate = None,
):
    """Update company details"""
    try:
        if not data:
            company = await get_company_by_id(company_id)
            if not company:
                raise HTTPException(status_code=404, detail="Company not found")
            return company

        company = await update_company(
            company_id,
            name=data.name,
            business_line=data.business_line,
            status=data.status,
        )

        if not company:
            raise HTTPException(status_code=404, detail="Company not found")

        return company
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# GET /companies/{company_id}/users
# ---------------------------------------------------------------------------

@router.get(
    "/{company_id}/users",
    response_model=CompanyUsersResponse,
    summary="Get users for a company",
    description="Returns all users belonging to the specified company.",
)
async def get_users_for_company(
    company_id: str = Path(..., description="Company ID"),
):
    """Fetch users for a company."""
    try:
        users = await get_company_users(company_id)
        return CompanyUsersResponse(
            company_id=company_id,
            users=[CompanyUserItem(**u) for u in users],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# GET /companies/{company_id}/ai-activity
# ---------------------------------------------------------------------------

@router.get(
    "/{company_id}/ai-activity",
    response_model=CompanyAIActivityResponse,
    summary="Get recent AI activity for a company",
    description="Returns the most recent AI questions asked within the specified company.",
)
async def get_ai_activity_for_company(
    company_id: str = Path(..., description="Company ID"),
    limit: int = Query(5, ge=1, le=20, description="Number of recent questions to return"),
):
    """Fetch recent AI activity for a company."""
    try:
        activity = await get_company_ai_activity(company_id, limit)
        return CompanyAIActivityResponse(
            company_id=company_id,
            activity=[AIActivityItem(**a) for a in activity],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))