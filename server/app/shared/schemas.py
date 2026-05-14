"""
app/shared/schemas.py
=========================
Shared Pydantic models (schemas) used by multiple modules.

Pydantic models serve three purposes in FastAPI:
    1. Request validation — FastAPI rejects invalid payloads automatically.
    2. Response serialisation — FastAPI converts these to JSON for the client.
    3. Swagger UI docs — FastAPI generates interactive API docs from them.

Keep schemas here that are referenced by more than one module.
Module-specific schemas live in their own module's schemas.py.
"""

from pydantic import BaseModel, Field
from typing import Any


class DocumentChunk(BaseModel):
    """
    Represents a single chunk of text extracted from a document,
    along with its embedding vector and source metadata.

    This is the atomic unit that flows through the pipeline:
        Document → [chunks] → [embedded chunks] → vector database
    """

    chunk_id: str = Field(..., description="Unique identifier for this chunk (UUID)")
    document_id: str = Field(..., description="ID of the parent document")
    company_id: str = Field(..., description="Company this document belongs to")
    chunk_text: str = Field(..., description="Raw text content of the chunk")
    embedding: list[float] = Field(
        ..., description="1536-dimensional vector from gemini-embedding-001"
    )
    source_file: str = Field(..., description="Original filename, e.g. Q3_Report.pdf")
    page_number: int | None = Field(None, description="Page number (PDFs only)")
    chunk_index: int = Field(..., description="Position of this chunk in the document")


class ErrorResponse(BaseModel):
    """Standard error response shape returned by all endpoints on failure."""

    error: str = Field(..., description="Human-readable error message")
    detail: Any | None = Field(None, description="Additional error context if available")