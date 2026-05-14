"""
Documents module Pydantic schemas for request/response validation.
"""

from datetime import datetime
from pydantic import BaseModel, Field
from typing import Literal


class DocumentItem(BaseModel):
    """Single document in list response."""
    id: str = Field(description="Document ID (UUID)")
    file_name: str = Field(description="Original filename")
    file_type: Literal["PDF", "DOCX", "XLSX", "CSV", "TXT"] = Field(description="File type")
    processing_status: str = Field(description="Processing status (Uploaded, Extracting, Chunking, Embedded, AI Ready, Failed)")
    created_at: datetime = Field(description="Upload timestamp")


class DocumentsListResponse(BaseModel):
    """Response for GET /documents/list."""
    total: int = Field(description="Total matching documents")
    documents: list[DocumentItem] = Field(description="Paginated documents")


class DocumentDeleteResponse(BaseModel):
    """Response for DELETE /documents/{document_id}."""
    success: bool = Field(description="Whether deletion succeeded")
    message: str = Field(description="Status message")
