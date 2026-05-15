from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from app.dashboard.services.stats import get_dashboard_stats
from app.dashboard.services.insights import get_recent_insights
from app.dashboard.services.recommendations import (
    get_recommendation_stats,
    get_top_recommendations,
)
from app.dashboard.services.sources import get_recent_sources
from app.dashboard.schemas import (
    DashboardStatsResponse,
    DashboardInsightsResponse,
    DashboardRecommendationsResponse,
    RecommendationStatsResponse,
    DashboardSourcesResponse,
)
from core.supabase_client import get_supabase_client


class CompanyItem(BaseModel):
    """A single company for the superadmin company selector"""
    id: str
    name: str


class CompaniesResponse(BaseModel):
    """List of all companies"""
    companies: list[CompanyItem]


router = APIRouter(tags=["SuperAdmin Dashboard"])


@router.get("/companies", response_model=CompaniesResponse)
async def get_all_companies():
    """Get list of all companies for superadmin company selector"""
    try:
        sb = get_supabase_client()
        result = sb.table("companies").select("id, company_name").order("company_name").execute()
        
        companies = []
        if result.data:
            for row in result.data:
                companies.append(
                    CompanyItem(id=row.get("id"), name=row.get("company_name", ""))
                )
        
        return CompaniesResponse(companies=companies)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard/stats", response_model=DashboardStatsResponse)
async def get_superadmin_stats(company_id: str = Query(..., description="Company ID")):
    """Get dashboard stats for superadmin viewing a specific company"""
    try:
        stats = await get_dashboard_stats(company_id)
        return DashboardStatsResponse(company_id=company_id, **stats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard/insights", response_model=DashboardInsightsResponse)
async def get_superadmin_insights(
    company_id: str = Query(..., description="Company ID"),
    limit: int = Query(3, ge=1, le=100, description="Number of insights to return"),
):
    """Get recent AI insights for superadmin viewing a specific company"""
    try:
        insights = await get_recent_insights(company_id, limit)
        return DashboardInsightsResponse(company_id=company_id, insights=insights)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/dashboard/recommendation-stats", response_model=RecommendationStatsResponse
)
async def get_superadmin_recommendation_stats(
    company_id: str = Query(..., description="Company ID"),
):
    """Get recommendation stats with risk distribution for superadmin viewing a specific company"""
    try:
        risk_distribution = await get_recommendation_stats(company_id)
        return RecommendationStatsResponse(company_id=company_id, risk_distribution=risk_distribution["risk_distribution"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard/recommendations", response_model=DashboardRecommendationsResponse)
async def get_superadmin_recommendations(
    company_id: str = Query(..., description="Company ID"),
    limit: int = Query(6, ge=1, le=100, description="Number of recommendations to return"),
):
    """Get top recommendations for superadmin viewing a specific company"""
    try:
        recommendations = await get_top_recommendations(company_id, limit)
        return DashboardRecommendationsResponse(company_id=company_id, recommendations=recommendations)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard/sources", response_model=DashboardSourcesResponse)
async def get_superadmin_sources(
    company_id: str = Query(..., description="Company ID"),
    limit: int = Query(3, ge=1, le=100, description="Number of sources to return"),
):
    """Get recent document sources for superadmin viewing a specific company"""
    try:
        sources = await get_recent_sources(company_id, limit)
        return DashboardSourcesResponse(company_id=company_id, sources=sources)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
