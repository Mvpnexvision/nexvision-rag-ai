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
from core.config import settings
from core.supabase_client import get_supabase_client


class CompanyItem(BaseModel):
    """A single company for the superadmin company selector"""
    id: str
    name: str


class CompaniesResponse(BaseModel):
    """List of all companies"""
    companies: list[CompanyItem]


MOCK_COMPANIES = [
    CompanyItem(id="1", name="NexVision Logistics"),
    CompanyItem(id="2", name="NexVision Clinic"),
    CompanyItem(id="3", name="NexVision HR"),
]

MOCK_STATS = {
    "total_files": 7,
    "ai_questions": 12,
    "ai_insights": 5,
    "high_risk_items": 2,
    "recommendations": 4,
}

MOCK_INSIGHTS = [
    {
        "id": "insight-1",
        "prompt": "What are the top compliance risks?",
        "subtitle": "The company should strengthen its document controls and approval workflows.",
        "risk_level": "Medium",
    },
    {
        "id": "insight-2",
        "prompt": "Where is the biggest documentation gap?",
        "subtitle": "Employee onboarding and HR compliance files are the weakest areas.",
        "risk_level": "Low",
    },
    {
        "id": "insight-3",
        "prompt": "Is any department at high risk?",
        "subtitle": "Operations shows the most urgent gaps around process controls.",
        "risk_level": "High",
    },
]

MOCK_RECOMMENDATION_STATS = {
    "risk_distribution": {
        "Low": 2,
        "Medium": 1,
        "High": 1,
        "Critical": 0,
    }
}

MOCK_RECOMMENDATIONS = [
    {"id": "rec-1", "title": "Standardize onboarding documents", "risk_level": "Medium"},
    {"id": "rec-2", "title": "Audit access controls", "risk_level": "High"},
    {"id": "rec-3", "title": "Formalize contract review", "risk_level": "Low"},
]

MOCK_SOURCES = [
    {"id": "source-1", "name": "Employee Handbook.pdf", "file_type": "PDF", "created_at": "2026-05-01T12:00:00Z"},
    {"id": "source-2", "name": "Safety Procedures.docx", "file_type": "DOCX", "created_at": "2026-05-03T15:30:00Z"},
    {"id": "source-3", "name": "Audit Checklist.xlsx", "file_type": "XLSX", "created_at": "2026-05-05T09:20:00Z"},
]


router = APIRouter(tags=["SuperAdmin Dashboard"])


@router.get("/companies", response_model=CompaniesResponse)
async def get_all_companies():
    """Get list of all companies for superadmin company selector"""
    try:
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
            return CompaniesResponse(companies=MOCK_COMPANIES)

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
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
            return DashboardStatsResponse(company_id=company_id, **MOCK_STATS)

        stats = await get_dashboard_stats(company_id)
        return DashboardStatsResponse(**stats)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dashboard/insights", response_model=DashboardInsightsResponse)
async def get_superadmin_insights(
    company_id: str = Query(..., description="Company ID"),
    limit: int = Query(3, ge=1, le=100, description="Number of insights to return"),
):
    """Get recent AI insights for superadmin viewing a specific company"""
    try:
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
            return DashboardInsightsResponse(company_id=company_id, insights=MOCK_INSIGHTS[:limit])

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
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
            return RecommendationStatsResponse(company_id=company_id, risk_distribution=MOCK_RECOMMENDATION_STATS["risk_distribution"])

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
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
            return DashboardRecommendationsResponse(company_id=company_id, recommendations=MOCK_RECOMMENDATIONS[:limit])

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
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
            return DashboardSourcesResponse(company_id=company_id, sources=MOCK_SOURCES[:limit])

        sources = await get_recent_sources(company_id, limit)
        return DashboardSourcesResponse(company_id=company_id, sources=sources)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
