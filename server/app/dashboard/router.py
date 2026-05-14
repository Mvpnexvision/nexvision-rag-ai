"""
modules/dashboard/router.py
============================
Dashboard Module — FastAPI Router

Implements dashboard aggregation endpoints that return statistics
for the frontend overview/home page.

Endpoints:
    GET /dashboard/stats       Return aggregated dashboard statistics
    GET /dashboard/insights    Return top 3 recent insights

All endpoints are company-scoped for multi-tenant access control.
All endpoints visible in Swagger UI at: http://localhost:8000/docs
"""

from fastapi import APIRouter, HTTPException, Query

from app.dashboard.schemas import (
    DashboardStatsResponse,
    DashboardInsightsResponse,
    InsightItem,
    RecommendationStatsResponse,
    DashboardRecommendationsResponse,
    RecommendationItem,
    DashboardSourcesResponse,
    SourceItem,
)
from app.dashboard.services.stats import get_dashboard_stats
from app.dashboard.services.insights import get_recent_insights
from app.dashboard.services.recommendations import (
    get_recommendation_stats,
    get_top_recommendations,
)
from app.dashboard.services.sources import get_recent_sources

router = APIRouter()


# ---------------------------------------------------------------------------
# GET /dashboard/stats
# ---------------------------------------------------------------------------

@router.get(
    "/stats",
    response_model=DashboardStatsResponse,
    summary="Get dashboard statistics",
    description=(
        "Returns aggregated statistics for the dashboard StatsCards component.\n\n"
        "Includes:\n"
        "- **Total Files**: Total documents uploaded\n"
        "- **AI Questions**: Total questions asked by users\n"
        "- **AI Insights**: Total insights generated\n"
        "- **High Risk Items**: Count of critical risk recommendations\n"
        "- **Recommendations**: Total recommendations created\n\n"
        "All data is scoped to the requesting company (multi-tenant access control)."
    ),
)
async def get_stats(
    company_id: str = Query(..., description="UUID of the company to get stats for"),
):
    """
    Fetch dashboard statistics for a company.
    
    Returns the 5 key metrics needed for the frontend StatsCards component.
    
    **Query Parameters:**
    - `company_id` — UUID of the company (required)
    
    **Response Example:**
    ```json
    {
        "company_id": "550e8400-e29b-41d4-a716-446655440000",
        "total_files": 142,
        "ai_questions": 87,
        "ai_insights": 87,
        "high_risk_items": 15,
        "recommendations": 32
    }
    ```
    
    **Errors:**
    - `400` — Missing or invalid `company_id`
    - `500` — Database query failed
    """
    
    # Validate company_id is not empty
    if not company_id or not company_id.strip():
        raise HTTPException(
            status_code=400,
            detail="company_id is required and must not be empty",
        )
    
    try:
        # Fetch statistics
        stats = await get_dashboard_stats(company_id)
        
        # Build response
        return DashboardStatsResponse(
            company_id=company_id,
            total_files=stats["total_files"],
            ai_questions=stats["ai_questions"],
            ai_insights=stats["ai_insights"],
            high_risk_items=stats["high_risk_items"],
            recommendations=stats["recommendations"],
        )
    
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch dashboard stats: {str(exc)}",
        )


# ---------------------------------------------------------------------------
# GET /dashboard/insights
# ---------------------------------------------------------------------------

@router.get(
    "/insights",
    response_model=DashboardInsightsResponse,
    summary="Get recent AI insights",
    description=(
        "Returns the top 3 most recent AI insights for the dashboard "
        "RecentRecommendations component.\n\n"
        "Each insight includes the original question, AI-generated answer, "
        "and risk level.\n\n"
        "All data is scoped to the requesting company (multi-tenant access control)."
    ),
)
async def get_insights(
    company_id: str = Query(..., description="UUID of the company to get insights for"),
):
    """
    Fetch recent AI insights for a company.
    
    Returns the top 3 most recent insights for the RecentRecommendations component.
    
    **Query Parameters:**
    - `company_id` — UUID of the company (required)
    
    **Response Example:**
    ```json
    {
        "company_id": "550e8400-e29b-41d4-a716-446655440000",
        "insights": [
            {
                "id": "uuid-1",
                "prompt": "Adidas - Low Sales",
                "subtitle": "Revenue dropped 12% in Q3 compared to last quarter.",
                "risk_level": "High"
            },
            {
                "id": "uuid-2",
                "prompt": "Nike - Low Customer Satisfaction",
                "subtitle": "NPS score fell below threshold across 3 regions.",
                "risk_level": "Medium"
            }
        ]
    }
    ```
    
    **Errors:**
    - `400` — Missing or invalid `company_id`
    - `500` — Database query failed
    """
    
    # Validate company_id is not empty
    if not company_id or not company_id.strip():
        raise HTTPException(
            status_code=400,
            detail="company_id is required and must not be empty",
        )
    
    try:
        # Fetch recent insights
        insights_data = await get_recent_insights(company_id)
        
        # Map to response schema
        insights = [
            InsightItem(
                id=item["id"],
                prompt=item["prompt"],
                subtitle=item["subtitle"],
                risk_level=item["risk_level"],
            )
            for item in insights_data
        ]
        
        # Build response
        return DashboardInsightsResponse(
            company_id=company_id,
            insights=insights,
        )
    
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch dashboard insights: {str(exc)}",
        )


# ---------------------------------------------------------------------------
# GET /dashboard/recommendation-stats
# ---------------------------------------------------------------------------

@router.get(
    "/recommendation-stats",
    response_model=RecommendationStatsResponse,
    summary="Get recommendation risk distribution",
    description=(
        "Returns the distribution of recommendations by risk level "
        "for the dashboard RecommendationsSummary component.\n\n"
        "Shows counts for Low, Medium, High, and Critical risk levels.\n\n"
        "All data is scoped to the requesting company (multi-tenant access control)."
    ),
)
async def get_recommendation_stats_endpoint(
    company_id: str = Query(..., description="UUID of the company to get recommendation stats for"),
):
    """
    Fetch recommendation statistics for a company.
    
    Returns the distribution of recommendations by risk level.
    
    **Query Parameters:**
    - `company_id` — UUID of the company (required)
    
    **Response Example:**
    ```json
    {
        "company_id": "550e8400-e29b-41d4-a716-446655440000",
        "risk_distribution": {
            "Low": 18,
            "Medium": 11,
            "High": 7,
            "Critical": 3
        }
    }
    ```
    
    **Errors:**
    - `400` — Missing or invalid `company_id`
    - `500` — Database query failed
    """
    
    # Validate company_id is not empty
    if not company_id or not company_id.strip():
        raise HTTPException(
            status_code=400,
            detail="company_id is required and must not be empty",
        )
    
    try:
        # Fetch recommendation stats
        stats = await get_recommendation_stats(company_id)
        
        # Build response
        return RecommendationStatsResponse(
            company_id=company_id,
            risk_distribution=stats["risk_distribution"],
        )
    
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch recommendation stats: {str(exc)}",
        )


# ---------------------------------------------------------------------------
# GET /dashboard/recommendations
# ---------------------------------------------------------------------------

@router.get(
    "/recommendations",
    response_model=DashboardRecommendationsResponse,
    summary="Get top recommendations",
    description=(
        "Returns the top N most recent recommendations for the dashboard.\n\n"
        "Sorted by created_at descending (newest first).\n\n"
        "All data is scoped to the requesting company (multi-tenant access control)."
    ),
)
async def get_recommendations_endpoint(
    company_id: str = Query(..., description="UUID of the company to get recommendations for"),
    limit: int = Query(6, description="Number of recommendations to return (default: 6)", ge=1, le=50),
):
    """
    Fetch top recommendations for a company.
    
    Returns the most recent recommendations sorted by date.
    
    **Query Parameters:**
    - `company_id` — UUID of the company (required)
    - `limit` — Number of recommendations to return (optional, default: 6, max: 50)
    
    **Response Example:**
    ```json
    {
        "company_id": "550e8400-e29b-41d4-a716-446655440000",
        "recommendations": [
            {
                "id": "uuid-1",
                "title": "Update employee data retention policy",
                "risk_level": "Critical"
            },
            {
                "id": "uuid-2",
                "title": "Review Q3 financial anomalies flagged by AI",
                "risk_level": "High"
            }
        ]
    }
    ```
    
    **Errors:**
    - `400` — Missing or invalid `company_id`, or invalid `limit`
    - `500` — Database query failed
    """
    
    # Validate company_id is not empty
    if not company_id or not company_id.strip():
        raise HTTPException(
            status_code=400,
            detail="company_id is required and must not be empty",
        )
    
    try:
        # Fetch top recommendations
        recs_data = await get_top_recommendations(company_id, limit)
        
        # Map to response schema
        recommendations = [
            RecommendationItem(
                id=rec["id"],
                title=rec["title"],
                risk_level=rec["risk_level"],
            )
            for rec in recs_data
        ]
        
        # Build response
        return DashboardRecommendationsResponse(
            company_id=company_id,
            recommendations=recommendations,
        )
    
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch recommendations: {str(exc)}",
        )


# ---------------------------------------------------------------------------
# GET /dashboard/sources
# ---------------------------------------------------------------------------

@router.get(
    "/sources",
    response_model=DashboardSourcesResponse,
    summary="Get recent document sources",
    description=(
        "Returns the top N most recent documents/sources for the dashboard "
        "ContextSources component.\n\n"
        "Each source includes file name, type, and upload timestamp.\n\n"
        "All data is scoped to the requesting company (multi-tenant access control)."
    ),
)
async def get_sources_endpoint(
    company_id: str = Query(..., description="UUID of the company to get sources for"),
    limit: int = Query(3, description="Number of sources to return (default: 3)", ge=1, le=50),
):
    """
    Fetch recent document sources for a company.
    
    Returns the most recent documents sorted by upload date.
    
    **Query Parameters:**
    - `company_id` — UUID of the company (required)
    - `limit` — Number of sources to return (optional, default: 3, max: 50)
    
    **Response Example:**
    ```json
    {
        "company_id": "550e8400-e29b-41d4-a716-446655440000",
        "sources": [
            {
                "id": "uuid-1",
                "name": "Q3_Financial_Report.pdf",
                "file_type": "PDF",
                "created_at": "2026-05-14T10:00:00Z"
            },
            {
                "id": "uuid-2",
                "name": "Project_Requirements_v2.docx",
                "file_type": "DOCX",
                "created_at": "2026-05-13T14:30:00Z"
            }
        ]
    }
    ```
    
    **Errors:**
    - `400` — Missing or invalid `company_id`, or invalid `limit`
    - `500` — Database query failed
    """
    
    # Validate company_id is not empty
    if not company_id or not company_id.strip():
        raise HTTPException(
            status_code=400,
            detail="company_id is required and must not be empty",
        )
    
    try:
        # Fetch recent sources
        sources_data = await get_recent_sources(company_id, limit)
        
        # Map to response schema
        sources = [
            SourceItem(
                id=src["id"],
                name=src["name"],
                file_type=src["file_type"],
                created_at=src["created_at"],
            )
            for src in sources_data
        ]
        
        # Build response
        return DashboardSourcesResponse(
            company_id=company_id,
            sources=sources,
        )
    
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch sources: {str(exc)}",
        )
