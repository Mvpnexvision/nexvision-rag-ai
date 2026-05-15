from pydantic import BaseModel, Field
from typing import Optional


class CompanyBase(BaseModel):
    """Base company data"""
    name: str = Field(..., alias="company_name")
    business_line: str = Field(..., description="Business line category")


class CompanyCreate(CompanyBase):
    """Request body for creating a company"""
    pass


class CompanyUpdate(BaseModel):
    """Request body for updating a company"""
    name: Optional[str] = Field(None, alias="company_name")
    business_line: Optional[str] = None
    status: Optional[str] = Field(None, description="Active or Inactive")
    admin_id: Optional[str] = None


class CompanyDetail(BaseModel):
    """Full company details with derived fields"""
    id: str
    name: str = Field(..., alias="company_name")
    business_line: str
    users: int = Field(..., description="Total user count")
    status: str = Field(..., description="Active or Inactive")
    admin: str = Field(..., description="Primary admin name")

    class Config:
        populate_by_name = True


class CompaniesListResponse(BaseModel):
    """List of companies"""
    companies: list[CompanyDetail]
