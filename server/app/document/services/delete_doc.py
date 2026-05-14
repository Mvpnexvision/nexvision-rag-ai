"""
Document deletion service.
"""

from core.supabase_client import get_supabase_client


async def delete_document(document_id: str, company_id: str) -> dict:
    """
    Delete a single document (soft delete via archive or hard delete).

    Args:
        document_id: Document UUID to delete
        company_id: Company UUID (for security scoping)

    Returns:
        dict with success status and message
    """
    try:
        supabase = get_supabase_client()
        # Verify document exists and belongs to company
        verify_response = supabase.table("documents").select("id").eq("id", document_id).eq("company_id", company_id).execute()
        
        if not verify_response.data:
            return {
                "success": False,
                "message": "Document not found or access denied"
            }
        
        # Delete the document
        delete_response = supabase.table("documents").delete().eq("id", document_id).eq("company_id", company_id).execute()
        
        return {
            "success": True,
            "message": "Document deleted successfully"
        }
    
    except Exception as e:
        raise Exception(f"Failed to delete document: {str(e)}")
