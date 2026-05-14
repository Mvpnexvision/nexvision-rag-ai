from fastapi import APIRouter, Path, HTTPException
from app.company.schemas import CompanyResponse, CompanyCreate, CompanyUpdate, CompanyListResponse
from app.company.services import (
    get_all_companies_with_details,
    get_company_by_id,
    create_company,
    update_company,
)

router = APIRouter(tags=["Companies"])


@router.get("", response_model=CompanyListResponse)
async def list_companies():
    """Get all companies with full details"""
    try:
        companies = await get_all_companies_with_details()
        return CompanyListResponse(companies=companies)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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


@router.post("", response_model=CompanyResponse)
async def create_new_company(data: CompanyCreate):
    """Create a new company"""
    try:
        company = await create_company(data.name, data.business_line)
        return company
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
