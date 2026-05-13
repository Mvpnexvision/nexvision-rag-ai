"""
modules/dashboard/services/insights.py
=======================================
Dashboard Insights Service

Responsibility: Fetch recent AI insights from the ai_questions table
for the dashboard RecentRecommendations display.

All queries are company-scoped for multi-tenant access control.
"""

from core.supabase_client import get_supabase_client


async def get_recent_insights(company_id: str, limit: int = 3) -> list[dict]:
    """
    Fetch the most recent AI insights for a company.
    
    Queries the `ai_questions` table and returns the top N most recent
    insights, sorted by created_at descending.
    
    Args:
        company_id: UUID of the company to fetch insights for.
        limit: Number of insights to return (default: 3).
    
    Returns:
        list of dicts with keys:
            id: UUID of the insight
            prompt: The original question asked
            subtitle: The AI-generated answer
            risk_level: Risk level (Low, Medium, High, Critical)
    
    Example:
        [
            {
                "id": "uuid-1",
                "prompt": "Adidas - Low Sales",
                "subtitle": "Revenue dropped 12% in Q3...",
                "risk_level": "High"
            },
            ...
        ]
    """
    sb = get_supabase_client()
    
    try:
        result = (
            sb.table("ai_questions")
            .select("id, question, answer, risk_level")
            .eq("company_id", company_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        
        # Map DB columns to response schema
        insights = []
        if result.data:
            for row in result.data:
                insights.append({
                    "id": row.get("id"),
                    "prompt": row.get("question", ""),
                    "subtitle": row.get("answer", ""),
                    "risk_level": row.get("risk_level", "Low"),
                })
        
        return insights
    
    except Exception as e:
        raise Exception(f"Failed to fetch recent insights: {e}")
