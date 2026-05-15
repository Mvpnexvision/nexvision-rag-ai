"""
modules/dashboard/services/stats.py
====================================
Dashboard Statistics Service

Responsibility: Fetch and aggregate statistics from across the RAG system
(documents, AI questions, recommendations) for the dashboard display.

All queries are company-scoped for multi-tenant access control.
"""

from core.supabase_client import get_supabase_client


async def get_dashboard_stats(company_id: str) -> dict:
    """
    Aggregate all dashboard statistics for a company.

    Fetches counts of:
    - Documents uploaded
    - AI questions asked
    - AI insights generated (from recommendations table)
    - Critical risk items (from recommendations JOIN ai_questions)
    - Total recommendations

    Args:
        company_id: UUID of the company to aggregate stats for.

    Returns:
        dict with keys:
            total_files: int
            ai_questions: int
            ai_insights: int
            high_risk_items: int
            recommendations: int
    """
    sb = get_supabase_client()

    try:
        # Total documents uploaded
        docs_result = (
            sb.table("documents")
            .select("id", count="exact")
            .eq("company_id", company_id)
            .execute()
        )
        total_files = docs_result.count or 0

        # Total AI questions asked
        questions_result = (
            sb.table("ai_questions")
            .select("id", count="exact")
            .eq("company_id", company_id)
            .execute()
        )
        ai_questions = questions_result.count or 0

        # Total recommendations — source of truth for insights
        recs_result = (
            sb.table("recommendations")
            .select("id", count="exact")
            .eq("company_id", company_id)
            .execute()
        )
        total_recommendations = recs_result.count or 0

        # AI insights = total recommendations (each recommendation IS an insight)
        ai_insights = total_recommendations

        # High risk items — recommendations where the linked ai_question is Critical
        high_risk_result = (
            sb.table("recommendations")
            .select("id, ai_questions(risk_level)")
            .eq("company_id", company_id)
            .execute()
        )
        high_risk_count = 0
        if high_risk_result.data:
            high_risk_count = sum(
                1 for row in high_risk_result.data
                if (row.get("ai_questions") or {}).get("risk_level") == "Critical"
            )

        return {
            "total_files": total_files,
            "ai_questions": ai_questions,
            "ai_insights": ai_insights,
            "high_risk_items": high_risk_count,
            "recommendations": total_recommendations,
        }

    except Exception as e:
        raise Exception(f"Failed to fetch dashboard stats: {e}")