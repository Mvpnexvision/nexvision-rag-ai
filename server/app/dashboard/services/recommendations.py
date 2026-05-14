"""
modules/dashboard/services/recommendations.py
==============================================
Dashboard Recommendations Service

Responsibility: Fetch recommendation statistics and recent recommendations
for the dashboard RecommendationsSummary and top recommendations display.

All queries are company-scoped for multi-tenant access control.
"""

from core.supabase_client import get_supabase_client


async def get_recommendation_stats(company_id: str) -> dict:
    """
    Fetch the risk distribution of recommendations for a company.
    
    Counts recommendations grouped by risk_level:
    - Low
    - Medium
    - High
    - Critical
    
    Args:
        company_id: UUID of the company to aggregate stats for.
    
    Returns:
        dict with key:
            risk_distribution: dict[str, int] — {risk_level: count, ...}
    
    Example:
        {
            "risk_distribution": {
                "Low": 18,
                "Medium": 11,
                "High": 7,
                "Critical": 3
            }
        }
    """
    sb = get_supabase_client()
    
    try:
        result = (
            sb.table("recommendations")
            .select("risk_level")
            .eq("company_id", company_id)
            .execute()
        )
        
        # Initialize risk distribution
        risk_distribution = {
            "Low": 0,
            "Medium": 0,
            "High": 0,
            "Critical": 0,
        }
        
        # Count by risk level
        if result.data:
            for row in result.data:
                risk = row.get("risk_level", "Low")
                if risk in risk_distribution:
                    risk_distribution[risk] += 1
        
        return {"risk_distribution": risk_distribution}
    
    except Exception as e:
        raise Exception(f"Failed to fetch recommendation stats: {e}")


async def get_top_recommendations(company_id: str, limit: int = 6) -> list[dict]:
    """
    Fetch the most recent recommendations for a company.
    
    Queries the `recommendation` table and returns the top N most recent
    recommendations, sorted by created_at descending.
    
    Args:
        company_id: UUID of the company to fetch recommendations for.
        limit: Number of recommendations to return (default: 6).
    
    Returns:
        list of dicts with keys:
            id: UUID of the recommendation
            title: Title/summary of the recommendation
            risk_level: Risk level (Low, Medium, High, Critical)
    
    Example:
        [
            {
                "id": "uuid-1",
                "title": "Update employee data retention policy",
                "risk_level": "Critical"
            },
            ...
        ]
    """
    sb = get_supabase_client()
    
    try:
        result = (
            sb.table("recommendations")
            .select("id, ai_question_id, ai_questions(question, risk_level)")
            .eq("company_id", company_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        
        # Map DB results to response schema
        recommendations = []
        if result.data:
            for row in result.data:
                recommendations.append({
                    "id": row.get("id"),
                    "title": (row.get("ai_questions") or {}).get("question", ""),
                    "risk_level": (row.get("ai_questions") or {}).get("risk_level", "Low"),
                })
        
        return recommendations
    
    except Exception as e:
        raise Exception(f"Failed to fetch top recommendations: {e}")
