"""
app/document/router.py
==================================
Document Module — FastAPI Router

Implements the spec'd API endpoints:
    POST  /documents/upload          Save file to storage → status: Uploaded
    POST  /documents/{id}/process    Run ingestion pipeline → status: AI Ready | Failed
    GET   /documents                 List all documents for a company

Additional endpoints (not in spec but required for lifecycle management):
    DELETE /documents/{id}           Delete document, chunks, and stored file
    GET    /documents/{id}/status    Poll the current processing_status of a document

Design: Upload and Process are SEPARATE endpoints.
    Upload → file saved immediately, returns document_id, status = Uploaded.
    Process → client calls this when ready, pipeline runs with status updates.
    This allows the frontend to show upload confirmation before the (slower)
    processing pipeline starts, and to show per-stage progress.

All endpoints visible in Swagger UI at: http://localhost:8000/docs
"""

import uuid
import io
from core.config import settings
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query, Depends
from typing import Annotated

from core.auth import CurrentUser, get_current_user

from app.document.schemas import (
    DocumentUploadResponse,
    DocumentProcessResponse,
    DocumentListResponse,
    DocumentRecord,
    DocumentDeleteResponse,
)
from app.document.services.extractor import extract_text_from_bytes, get_file_type
from app.document.services.chunker import chunk_text
from app.document.services.embedder import embed_chunks, embed_single_text
from app.document.services.storage import (
    upload_file_to_storage,
    delete_file_from_storage,
    get_signed_url,
)
from app.document.services.vector_store import (
    store_chunks,
    store_document_record,
    update_document_summary,
    delete_chunks_by_document,
    delete_document_record,
    list_company_documents,
    get_document_by_id,
)
from app.document.services.status import set_status
from core.gemini_client import get_chat_model

router = APIRouter()


# ---------------------------------------------------------------------------
# POST /documents/upload
# ---------------------------------------------------------------------------

@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    summary="Upload a document file",
    description=(
        "**Step 1 of 2.** Accepts a file upload (PDF, DOCX, XLSX, CSV, or TXT), "
        "saves it to Supabase Storage, creates a `documents` record with status "
        "`Uploaded`, and returns the `document_id`.\n\n"
        "After this call succeeds, trigger processing with "
        "`POST /documents/{id}/process`.\n\n"
        "**Supported formats:** PDF, DOCX, XLSX, CSV, TXT"
    ),
)
async def upload_document(
    # File upload — multipart/form-data
    file: UploadFile = File(..., description="Document file to upload (PDF, DOCX, XLSX, CSV, TXT)"),
    # Metadata fields sent alongside the file as Form fields
    company_id: Annotated[str, Form(description="UUID of the owning company")] = ...,
    uploaded_by: Annotated[str, Form(description="UUID of the uploading user (Supabase Auth UID)")] = ...,
    tags: Annotated[str, Form(description="Comma-separated tags, e.g. 'q3,finance,risk'")] = "",
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Save a file to Supabase Storage and create a document record.

    This endpoint completes quickly — it does NOT run the processing pipeline.
    The client receives a `document_id` and can immediately display upload
    confirmation while the user optionally triggers processing.

    **Form fields (sent as multipart/form-data alongside the file):**
    - `file` — the document file
    - `company_id` — owning company UUID
    - `uploaded_by` — uploader's Supabase Auth UID
    - `tags` — comma-separated string, e.g. "q3,finance,vendor"
    """
    filename = file.filename or "document"

    # Validate file type before reading bytes
    file_type = get_file_type(filename)

    # Generate document UUID upfront so we can use it in the storage path
    document_id = str(uuid.uuid4())

    # Read file bytes once — we need them for both storage and extraction
    raw_bytes = await file.read()

    # ── Enforce MAX_UPLOAD_MB limit ──────────────────────────────────────────
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    if len(raw_bytes) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=(
                f"'{filename}' exceeds the maximum upload size of {settings.MAX_UPLOAD_MB}MB. "
                f"File size: {len(raw_bytes) / (1024 * 1024):.2f}MB. "
                "Please reduce the file size and try again."
            ),
        )

    # ── Save to Supabase Storage ─────────────────────────────────────────────
    file.file = io.BytesIO(raw_bytes)

    storage_path = await upload_file_to_storage(
        file=file,
        company_id=company_id,
        document_id=document_id,
    )

    # ── Parse tags ───────────────────────────────────────────────────────────
    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []

    # ── Create document record with status = Uploaded ────────────────────────
    await store_document_record(
        document_id=document_id,
        company_id=company_id,
        uploaded_by=uploaded_by,
        file_name=filename,
        file_type=file_type,
        file_url=storage_path,
        tags=tag_list,
    )

    return DocumentUploadResponse(
        document_id=document_id,
        file_name=filename,
        file_type=file_type,
        file_url=storage_path,
        processing_status="Uploaded",
        message=(
            f"'{filename}' uploaded successfully. "
            f"Call POST /documents/{document_id}/process to start ingestion."
        ),
    )


# ---------------------------------------------------------------------------
# POST /documents/{id}/process
# ---------------------------------------------------------------------------

@router.post(
    "/{document_id}/process",
    response_model=DocumentProcessResponse,
    summary="Run the ingestion pipeline on an uploaded document",
    description=(
        "**Step 2 of 2.** Triggers the full processing pipeline for a previously "
        "uploaded document:\n\n"
        "1. **Extracting** — read text/data from the stored file\n"
        "2. **Chunking** — split into overlapping segments\n"
        "3. **Embedded** — create 1536-dim vectors via Gemini\n"
        "4. **AI Ready** — document available for AI Chat and Insights\n\n"
        "Status is updated in the database at each stage. If any stage fails, "
        "status is set to **Failed** with an error detail.\n\n"
        "The document must already exist (created via `POST /documents/upload`)."
    ),
)
async def process_document(
    document_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Run Extract → Chunk → Embed → Store for an already-uploaded document.

    The file is fetched from Supabase Storage using the `file_url` saved
    during upload — the client does NOT need to re-send the file.

    Status transitions:
        Uploaded → Extracting → Chunking → Embedded → AI Ready
                                                     ↘ Failed (on any error)

    On completion, a Gemini-generated summary is saved to the document record.
    """
    # Verify document exists
    doc = await get_document_by_id(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document '{document_id}' not found.")

    # Skip RAG pipeline for context files (.md)
    if doc.get("is_context_file"):
        await set_status(document_id, "AI Ready")
        return DocumentProcessResponse(
            document_id=document_id,
            file_name=doc["file_name"],
            processing_status="AI Ready",
            total_chunks=0,
            summary=None,
            error_detail=None,
            message=f"'{doc['file_name']}' is a context file — skipped RAG pipeline, marked as AI Ready.",
        )

    company_id = doc["company_id"]
    file_name = doc["file_name"]
    file_url = doc["file_url"]  # Supabase Storage path

    # ── Fetch file bytes from Supabase Storage ───────────────────────────────
    from core.supabase_client import get_supabase_client
    from core.config import settings

    try:
        sb = get_supabase_client()
        raw_bytes: bytes = sb.storage.from_(settings.SUPABASE_STORAGE_BUCKET).download(file_url)
    except Exception as exc:
        await set_status(document_id, "Failed", error_message=f"Storage download failed: {exc}")
        raise HTTPException(
            status_code=500,
            detail=f"Could not fetch file from storage: {exc}"
        )

    total_chunks = 0
    summary = None

    try:
        # ── Stage: Extracting ────────────────────────────────────────────────
        await set_status(document_id, "Extracting")
        raw_text = extract_text_from_bytes(raw_bytes, file_name)

        # ── Stage: Chunking ──────────────────────────────────────────────────
        await set_status(document_id, "Chunking")
        chunks = chunk_text(
            text=raw_text,
            document_id=document_id,
            company_id=company_id,
            source_file=file_name,
        )

        if not chunks:
            raise ValueError("Chunking produced no segments. The file may have no readable content.")

        # ── Stage: Embedded ──────────────────────────────────────────────────
        # (status set before embedding starts — can take several seconds for large docs)
        embedded = await embed_chunks(chunks)
        await set_status(document_id, "Embedded")

        # ── Store in vector database ─────────────────────────────────────────
        total_chunks = await store_chunks(embedded)

        # ── Generate AI summary ──────────────────────────────────────────────
        # Build summary from the first few chunks (representative of the document)
        context = "\n\n".join(
            f"[{c['source_file']}]: {c['text']}" for c in chunks[:8]
        )
        model = get_chat_model()
        summary_prompt = (
            "You are a business document analyst. Read the following document excerpts "
            "and write a concise summary (3–5 sentences) covering the document's main "
            "topic and key business relevance.\n\n"
            f"DOCUMENT EXCERPTS:\n{context}\n\nSUMMARY:"
        )
        summary_response = model.generate_content(
            model=settings.GEMINI_CHAT_MODEL,
            contents=summary_prompt,
        )
        summary = summary_response.text.strip() if summary_response.text else None

        if summary:
            await update_document_summary(document_id, summary)

        # ── Final status: AI Ready ───────────────────────────────────────────
        await set_status(document_id, "AI Ready")

        return DocumentProcessResponse(
            document_id=document_id,
            file_name=file_name,
            processing_status="AI Ready",
            total_chunks=total_chunks,
            summary=summary,
            error_detail=None,
            message=(
                f"'{file_name}' processed successfully. "
                f"{total_chunks} chunks stored. Document is now AI Ready."
            ),
        )

    except Exception as exc:
        # Any pipeline failure → set status to Failed so the user can act
        error_msg = str(exc)
        await set_status(document_id, "Failed", error_message=error_msg)

        return DocumentProcessResponse(
            document_id=document_id,
            file_name=file_name,
            processing_status="Failed",
            total_chunks=total_chunks,
            summary=None,
            error_detail=error_msg,
            message=(
                f"Processing failed at a pipeline stage. "
                f"Error: {error_msg}. "
                f"You may reprocess via POST /documents/{document_id}/process "
                f"or delete and re-upload a corrected file."
            ),
        )


# ---------------------------------------------------------------------------
# GET /documents
# ---------------------------------------------------------------------------

@router.get(
    "",
    response_model=DocumentListResponse,
    summary="List all documents for a company",
    description=(
        "Returns all document records for the specified company, ordered by "
        "most recently uploaded first. Includes current `processing_status` "
        "so the frontend can show pipeline progress per document."
    ),
)
async def list_documents(
    company_id: str = Query(..., description="UUID of the company to list documents for"),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Retrieve all documents uploaded by a company.

    Use the `processing_status` field to determine what actions are available:
    - `Uploaded` → trigger processing
    - `Extracting / Chunking / Embedded` → pipeline running, poll again
    - `AI Ready` → available for AI Chat and Insights
    - `Failed` → reprocess or re-upload
    """
    records = await list_company_documents(company_id)

    # Map raw DB records to response schema
    # Supabase returns 'id' — our schema exposes it as 'document_id' via alias
    documents = []
    for r in records:
        documents.append(
            DocumentRecord(
                id=r["id"],
                company_id=r["company_id"],
                uploaded_by=r["uploaded_by"],
                file_name=r["file_name"],
                file_type=r["file_type"],
                file_url=r["file_url"],
                tags=r.get("tags") or [],
                processing_status=r.get("processing_status", "Uploaded"),
                summary=r.get("summary"),
                created_at=str(r.get("created_at", "")),
            )
        )

    return DocumentListResponse(
        company_id=company_id,
        documents=documents,
        total=len(documents),
    )


# ---------------------------------------------------------------------------
# GET /documents/{id}/status  — lightweight poll endpoint
# ---------------------------------------------------------------------------

@router.get(
    "/{document_id}/status",
    summary="Poll the processing status of a document",
    description=(
        "Lightweight endpoint for the frontend to check pipeline progress. "
        "Returns only the document ID and current status — no full record. "
        "Poll this every 2–3 seconds while status is not 'AI Ready' or 'Failed'."
    ),
)
async def get_document_status(document_id: str):
    """
    Return the current processing_status of a single document.

    Intended for polling during the processing pipeline. Once status is
    'AI Ready' or 'Failed', polling can stop.
    """
    doc = await get_document_by_id(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail=f"Document '{document_id}' not found.")

    return {
        "document_id": document_id,
        "file_name": doc.get("file_name"),
        "processing_status": doc.get("processing_status"),
    }


# ---------------------------------------------------------------------------
# DELETE /documents/{id}
# ---------------------------------------------------------------------------

@router.delete(
    "/{document_id}",
    response_model=DocumentDeleteResponse,
    summary="Delete a document and all associated data",
    description=(
        "Permanently removes:\n"
        "- The document record from the `documents` table\n"
        "- All vector chunks from `document_chunks`\n"
        "- The original file from Supabase Storage\n\n"
        "This action is irreversible. The file must be re-uploaded to reingest."
    ),
)
async def delete_document(document_id: str):
    """
    Hard delete a document and all its associated data.

    Removes the DB record, all vector chunks, and the stored file.
    """
    doc = await get_document_by_id(document_id)
    if not doc:
        return DocumentDeleteResponse(
            document_id=document_id,
            status="not_found",
            message="Document not found — it may already have been deleted.",
        )

    # Delete vector chunks
    await delete_chunks_by_document(document_id)

    # Delete stored file from Supabase Storage
    if doc.get("file_url"):
        delete_file_from_storage(doc["file_url"])

    # Delete document record
    await delete_document_record(document_id)

    return DocumentDeleteResponse(
        document_id=document_id,
        status="deleted",
        message=f"Document '{doc.get('file_name', document_id)}' and all associated data deleted.",
    )

# ---------------------------------------------------------------------------
# Documents Page Endpoints — for the documents listing/filter page
# ---------------------------------------------------------------------------

# Import the list and delete services for documents page
from app.document.services.list_page import get_documents_list as get_list_page_service
from app.document.services.delete_doc import delete_document as delete_doc_service

@router.get(
    "/page/list",
    summary="List documents with pagination and filtering",
    description="Fetch paginated documents with optional search, file_type, and date filtering."
)
async def list_documents_page(
    company_id: str = Query(..., description="Company UUID"),
    limit: int = Query(20, description="Results per page (default: 20)", ge=1, le=100),
    offset: int = Query(0, description="Pagination offset (default: 0)", ge=0),
    search: str = Query(None, description="Search filename (partial match, case-insensitive)"),
    file_type: str = Query(None, description="Filter by file type (PDF, DOCX, XLSX, CSV, TXT)"),
    date_from: str = Query(None, description="Filter from date (YYYY-MM-DD)"),
    date_to: str = Query(None, description="Filter to date (YYYY-MM-DD)"),
):
    """
    Fetch paginated documents with optional filtering for the documents page.
    
    Query parameters:
    - **company_id**: Required. Company UUID for scoping.
    - **limit**: Optional. Results per page (1-100, default: 20).
    - **offset**: Optional. Pagination offset (default: 0).
    - **search**: Optional. Search by filename.
    - **file_type**: Optional. Filter by type (PDF|DOCX|XLSX|CSV|TXT).
    - **date_from**: Optional. Filter from date (YYYY-MM-DD).
    - **date_to**: Optional. Filter to date (YYYY-MM-DD).
    """
    try:
        result = await get_list_page_service(
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
    "/page/{document_id}",
    summary="Delete a single document (documents page)",
    description="Delete a document and all associated data from the documents page."
)
async def delete_document_page(
    document_id: str,
    company_id: str = Query(..., description="Company UUID"),
):
    """
    Delete a single document for the documents page.
    
    Query parameters:
    - **document_id**: Required in path. Document UUID.
    - **company_id**: Required. Company UUID (for security scoping).
    """
    try:
        result = await delete_doc_service(document_id=document_id, company_id=company_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
