"""
app/document/schemas.py
====================================
Request and response schemas for the Document Module.

Aligned to the `documents` table spec:
    company_id, uploaded_by, file_name, file_type, file_url,
    business_line, department, category, tags,
    processing_status, summary, created_at

Processing status values (per spec):
    Uploaded | Extracting | Chunking | Embedded | AI Ready | Failed
"""

from pydantic import BaseModel, Field
from typing import Literal


# ── Type aliases ──────────────────────────────────────────────────────────────

ProcessingStatus = Literal[
    "Uploaded",
    "Extracting",
    "Chunking",
    "Embedded",
    "AI Ready",
    "Failed",
]

FileType = Literal["PDF", "DOCX", "XLSX", "CSV", "TXT", "MD"]


# ── Upload endpoint ────────────────────────────────────────────────────────────

class DocumentUploadRequest(BaseModel):
    """
    Metadata submitted alongside the file in the upload form.

    These fields populate the `documents` table row. The file itself is
    sent as multipart form-data alongside this JSON body via FastAPI Form fields.
    """

    company_id: str = Field(..., description="UUID of the owning company")
    uploaded_by: str = Field(..., description="UUID of the uploading user (Supabase Auth UID)")
    business_line: str | None = Field(None, description="Business line classification, e.g. 'Finance'")
    department: str | None = Field(None, description="Department label, e.g. 'Accounts Payable'")
    category: str | None = Field(None, description="Document category, e.g. 'Quarterly Report'")
    tags: list[str] = Field(default_factory=list, description="Free-form tags for search/filtering")

class DocumentUploadResponse(BaseModel):
    """
    Returned immediately after a file is saved to storage.

    At this point, processing_status = 'Uploaded'.
    The client should then call POST /documents/{id}/process to start
    the ingestion pipeline.
    """

    document_id: str = Field(..., description="UUID assigned to this document")
    file_name: str = Field(..., description="Original filename as uploaded")
    file_type: FileType = Field(..., description="Detected file format")
    file_url: str = Field(..., description="Supabase Storage path where the file is saved")
    processing_status: ProcessingStatus = Field(default="Uploaded")
    message: str = Field(..., description="Human-readable confirmation")


# ── Process endpoint ───────────────────────────────────────────────────────────

class DocumentProcessResponse(BaseModel):
    """
    Returned after the full ingestion pipeline completes or fails.

    If status = 'AI Ready', the document is ready for AI Chat and Insights.
    If status = 'Failed', the error_detail explains what went wrong.
    """

    document_id: str
    file_name: str
    processing_status: ProcessingStatus
    total_chunks: int = Field(0, description="Number of chunks stored in vector DB")
    summary: str | None = Field(None, description="AI-generated summary (set on success)")
    error_detail: str | None = Field(None, description="Error message if status = 'Failed'")
    message: str


# ── List endpoint ──────────────────────────────────────────────────────────────

class DocumentRecord(BaseModel):
    """
    A single document record as returned by GET /documents.
    Maps directly to the `documents` table columns.
    """

    document_id: str = Field(..., alias="id")
    company_id: str
    uploaded_by: str
    file_name: str
    file_type: str
    file_url: str
    business_line: str | None
    department: str | None
    category: str | None
    tags: list[str]
    processing_status: ProcessingStatus
    summary: str | None
    is_context_file: bool = False
    created_at: str

    class Config:
        populate_by_name = True  # allow both 'id' and 'document_id'


class DocumentListResponse(BaseModel):
    """Response for GET /documents — all documents for a company."""

    company_id: str
    documents: list[DocumentRecord]
    total: int


# ── Delete endpoint ────────────────────────────────────────────────────────────

class DocumentDeleteResponse(BaseModel):
    """Returned after a document and all its data is deleted."""

    document_id: str
    status: Literal["deleted", "not_found"]
    message: str


# ── Documents Page Endpoints ───────────────────────────────────────────────────

class DocumentPageItem(BaseModel):
    """Single document in documents page list response."""
    id: str = Field(description="Document ID (UUID)")
    file_name: str = Field(description="Original filename")
    file_type: FileType = Field(description="File type")
    processing_status: ProcessingStatus = Field(description="Processing status")
    created_at: str = Field(description="Upload timestamp")


class DocumentsPageListResponse(BaseModel):
    """Response for GET /documents/page/list."""
    total: int = Field(description="Total matching documents")
    documents: list[DocumentPageItem] = Field(description="Paginated documents")


class DocumentPageDeleteResponse(BaseModel):
    """Response for DELETE /documents/page/{document_id}."""
    success: bool = Field(description="Whether deletion succeeded")
    message: str = Field(description="Status message")
