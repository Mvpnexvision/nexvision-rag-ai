"""
modules/business_lines/schemas.py
==================================
Business Lines Module — Pydantic Schemas
 
Defines request/response models for the business lines endpoints.
"""
 
from pydantic import BaseModel
 
 
class BusinessLineRecord(BaseModel):
    """A single business line with its company count."""
    name: str
    company_count: int
 
 
class BusinessLineListResponse(BaseModel):
    """Response model for GET /business-lines."""
    business_lines: list[BusinessLineRecord]