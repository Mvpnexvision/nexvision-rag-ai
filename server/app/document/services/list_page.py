"""
Document listing service with filtering and pagination.
"""

from core.supabase_client import get_supabase_client


async def get_documents_list(
    company_id: str,
    limit: int = 20,
    offset: int = 0,
    search: str = None,
    file_type: str = None,
    date_from: str = None,
    date_to: str = None,
) -> dict:
    """
    Fetch paginated documents with optional filtering.

    Args:
        company_id: Company UUID (scoping)
        limit: Number of results (1-100)
        offset: Pagination offset
        search: Filter by filename (case-insensitive partial match)
        file_type: Filter by file type (PDF, DOCX, etc)
        date_from: Filter by created_at >= date (YYYY-MM-DD)
        date_to: Filter by created_at <= date (YYYY-MM-DD)

    Returns:
        dict with 'total' count and 'documents' list
    """
    try:
        supabase = get_supabase_client()
        
        # Get count with all filters applied
        count_query = supabase.table("documents").select("id", count="exact").eq("company_id", company_id)
        
        if search:
            count_query = count_query.ilike("file_name", f"%{search}%")
        if file_type:
            count_query = count_query.eq("file_type", file_type)
        if date_from:
            count_query = count_query.gte("created_at", f"{date_from}T00:00:00Z")
        if date_to:
            count_query = count_query.lte("created_at", f"{date_to}T23:59:59Z")
        
        count_response = count_query.execute()
        total = count_response.count if count_response.count is not None else 0
        
        # Get paginated documents with same filters
        docs_query = supabase.table("documents").select("id, file_name, file_type, processing_status, created_at").eq("company_id", company_id)
        
        if search:
            docs_query = docs_query.ilike("file_name", f"%{search}%")
        if file_type:
            docs_query = docs_query.eq("file_type", file_type)
        if date_from:
            docs_query = docs_query.gte("created_at", f"{date_from}T00:00:00Z")
        if date_to:
            docs_query = docs_query.lte("created_at", f"{date_to}T23:59:59Z")
        
        docs_response = docs_query.order("created_at", desc=True).range(offset, offset + limit - 1).execute()
        
        return {
            "total": total,
            "documents": docs_response.data or []
        }
    
    except Exception as e:
        raise Exception(f"Failed to fetch documents: {str(e)}")


async def get_document_count(company_id: str) -> int:
    """Get total document count for a company."""
    try:
        supabase = get_supabase_client()
        response = supabase.table("documents").select("id", count="exact").eq("company_id", company_id).execute()
        return response.count or 0
    except Exception as e:
        raise Exception(f"Failed to count documents: {str(e)}")
