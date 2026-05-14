"""
modules/dashboard/services/sources.py
======================================
Dashboard Sources Service

Responsibility: Fetch recent documents/sources for the dashboard
ContextSources display.

All queries are company-scoped for multi-tenant access control.
"""

from core.supabase_client import get_supabase_client


async def get_recent_sources(company_id: str, limit: int = 3) -> list[dict]:
    """
    Fetch the most recent documents/sources for a company.
    
    Queries the `documents` table and returns the top N most recent
    documents, sorted by created_at descending.
    
    Args:
        company_id: UUID of the company to fetch sources for.
        limit: Number of sources to return (default: 3).
    
    Returns:
        list of dicts with keys:
            id: UUID of the document
            name: File name
            file_type: File type (PDF, DOCX, XLSX, CSV, TXT)
            created_at: ISO 8601 timestamp when uploaded
    
    Example:
        [
            {
                "id": "uuid-1",
                "name": "Q3_Financial_Report.pdf",
                "file_type": "PDF",
                "created_at": "2026-05-14T10:00:00Z"
            },
            ...
        ]
    """
    sb = get_supabase_client()
    
    try:
        result = (
            sb.table("documents")
            .select("id, file_name, file_type, created_at")
            .eq("company_id", company_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        
        # Map DB results to response schema
        sources = []
        if result.data:
            for row in result.data:
                sources.append({
                    "id": row.get("id"),
                    "name": row.get("file_name", ""),
                    "file_type": row.get("file_type", "TXT"),
                    "created_at": row.get("created_at", ""),
                })
        
        return sources
    
    except Exception as e:
        raise Exception(f"Failed to fetch recent sources: {e}")
