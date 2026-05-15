"""
modules/dashboard/schemas.py
=============================
Request and response schemas for the Dashboard Module.

The dashboard aggregates statistics from across the RAG system for display
on the frontend home/overview page.
"""

from pydantic import BaseModel, Field
from typing import Literal


class DashboardStatsResponse(BaseModel):
    """
    Dashboard statistics for the StatsCards component.
    
    Contains the 5 key metrics displayed on the dashboard home page.
    """
    
    company_id: str = Field(..., description="UUID of the company")
    total_files: int = Field(..., description="Total number of documents uploaded", ge=0)
    ai_questions: int = Field(..., description="Total AI questions asked", ge=0)
    ai_insights: int = Field(..., description="Total AI insights generated", ge=0)
    high_risk_items: int = Field(..., description="Count of critical risk recommendations", ge=0)
    recommendations: int = Field(..., description="Total recommendations created", ge=0)


class InsightItem(BaseModel):
    """
    A single AI insight item for the RecentRecommendations component.
    """
    
    id: str = Field(..., description="UUID of the insight")
    prompt: str = Field(..., description="The original question asked")
    subtitle: str = Field(..., description="The AI-generated answer/insight")
    risk_level: Literal["Low", "Medium", "High", "Critical"] = Field(
        ...,
        description="Risk level of this insight"
    )


class DashboardInsightsResponse(BaseModel):
    """
    Dashboard insights response for the RecentRecommendations component.
    
    Returns the top 3 most recent insights.
    """
    
    company_id: str = Field(..., description="UUID of the company")
    insights: list[InsightItem] = Field(
        ...,
        description="Top N most recent insights (default: 3)"
    )


class RecommendationStatsResponse(BaseModel):
    """
    Recommendation statistics response for the RecommendationsSummary component.
    
    Returns the distribution of recommendations by risk level.
    """
    
    company_id: str = Field(..., description="UUID of the company")
    risk_distribution: dict[str, int] = Field(
        ...,
        description=(
            "Count of recommendations by risk level. "
            "Example: {'Low': 18, 'Medium': 11, 'High': 7, 'Critical': 3}"
        ),
    )


class RecommendationItem(BaseModel):
    """
    A single recommendation for the dashboard display.
    """
    
    id: str = Field(..., description="UUID of the recommendation")
    title: str = Field(..., description="Title/summary of the recommendation")
    risk_level: Literal["Low", "Medium", "High", "Critical"] = Field(
        ...,
        description="Risk level of this recommendation"
    )


class DashboardRecommendationsResponse(BaseModel):
    """
    Dashboard recommendations response for the top recommendations display.
    
    Returns the top N most recent recommendations.
    """
    
    company_id: str = Field(..., description="UUID of the company")
    recommendations: list[RecommendationItem] = Field(
        ...,
        description="Top N most recent recommendations"
    )


class SourceItem(BaseModel):
    """
    A single document source for the dashboard display.
    """
    
    id: str = Field(..., description="UUID of the document")
    name: str = Field(..., description="File name")
    file_type: Literal["PDF", "DOCX", "XLSX", "CSV", "TXT", "MD"] = Field(
        ...,
        description="File type/format"
    )
    created_at: str = Field(
        ...,
        description="ISO 8601 timestamp when the file was uploaded"
    )


class DashboardSourcesResponse(BaseModel):
    """
    Dashboard sources response for the ContextSources component.
    
    Returns the top N most recent document sources.
    """
    
    company_id: str = Field(..., description="UUID of the company")
    sources: list[SourceItem] = Field(
        ...,
        description="Top N most recent document sources"
    )

