"""
Documents API router with list and delete endpoints.
"""

from fastapi import APIRouter, Query, Path, HTTPException
from datetime import datetime
from .schemas import DocumentsListResponse, DocumentDeleteResponse
from .services.list import get_documents_list
from .services.delete import delete_document

router = APIRouter()


@router.get(
    "/list",
    response_model=DocumentsListResponse,
    summary="List documents with pagination and filtering"
)
async def list_documents(
    company_id: str = Query(..., description="Company UUID"),
    limit: int = Query(20, description="Results per page (default: 20)", ge=1, le=100),
    offset: int = Query(0, description="Pagination offset (default: 0)", ge=0),
    search: str = Query(None, description="Search filename (partial match, case-insensitive)"),
    file_type: str = Query(None, description="Filter by file type (PDF, DOCX, XLSX, CSV, TXT)"),
    date_from: str = Query(None, description="Filter from date (YYYY-MM-DD)"),
    date_to: str = Query(None, description="Filter to date (YYYY-MM-DD)"),
):
    """
    Fetch paginated documents with optional filtering.

    Query parameters:
    - **company_id**: Required. Company UUID for scoping.
    - **limit**: Optional. Results per page (1-100, default: 20).
    - **offset**: Optional. Pagination offset (default: 0).
    - **search**: Optional. Search by filename.
    - **file_type**: Optional. Filter by type (PDF|DOCX|XLSX|CSV|TXT).
    - **date_from**: Optional. Filter from date (YYYY-MM-DD).
    - **date_to**: Optional. Filter to date (YYYY-MM-DD).

    Returns paginated list with total count.
    """
    try:
        result = await get_documents_list(
            company_id=company_id,
            limit=limit,
            offset=offset,
            search=search,
            file_type=file_type,
            date_from=date_from,
            date_to=date_to,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete(
    "/{document_id}",
    response_model=DocumentDeleteResponse,
    summary="Delete a document"
)
async def delete_single_document(
    document_id: str = Path(..., description="Document UUID to delete"),
    company_id: str = Query(..., description="Company UUID"),
):
    """
    Delete a single document by ID.

    Query parameters:
    - **document_id**: Required. Document UUID.
    - **company_id**: Required. Company UUID (for security scoping).

    Returns success status.
    """
    try:
        result = await delete_document(document_id=document_id, company_id=company_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
