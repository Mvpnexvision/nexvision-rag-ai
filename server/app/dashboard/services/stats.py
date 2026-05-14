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
    - AI insights generated
    - Critical risk recommendations
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
        # Fetch all documents for the company
        docs_result = (
            sb.table("documents")
            .select("id")
            .eq("company_id", company_id)
            .execute()
        )
        total_files = len(docs_result.data) if docs_result.data else 0
        
        # Fetch all AI questions
        questions_result = (
            sb.table("ai_questions")
            .select("id")
            .eq("company_id", company_id)
            .execute()
        )
        ai_questions = len(questions_result.data) if questions_result.data else 0
        
        # AI insights = same as ai_questions (each question generates one insight)
        ai_insights = ai_questions
        
        # Fetch all recommendations
        recs_result = (
            sb.table("recommendations")
            .select("id, risk_level")
            .eq("company_id", company_id)
            .execute()
        )
        
        total_recommendations = 0
        high_risk_count = 0
        
        if recs_result.data:
            total_recommendations = len(recs_result.data)
            # Count critical risk items only
            for rec in recs_result.data:
                risk = rec.get("risk_level")
                if risk == "Critical":
                    high_risk_count += 1
        
        return {
            "total_files": total_files,
            "ai_questions": ai_questions,
            "ai_insights": ai_insights,
            "high_risk_items": high_risk_count,
            "recommendations": total_recommendations,
        }
    
    except Exception as e:
        raise Exception(f"Failed to fetch dashboard stats: {e}")
