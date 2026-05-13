"""
modules/document_module/services/vector_store.py
=================================================
STAGE 4 of the document pipeline: Store
STAGE 5 of the RAG pipeline: Retrieve

Responsibility: Save embedded chunks into Supabase pgvector and retrieve
the most relevant chunks for a given query vector.

Schema alignment (v2 — matches product spec):
    document_chunks columns:
        id            uuid primary key
        document_id   uuid (FK → documents.id)
        company_id    uuid (FK → companies.id)
        chunk_text    text          ← renamed from 'text' in v1
        chunk_index   int
        page_number   int (nullable)
        embedding_id  text          ← the vector is stored inline; this is a label
        metadata_json jsonb         ← source_file, sheet_name, row_range, etc.
        embedding     vector(768)   ← the actual pgvector column
        created_at    timestamptz

The `metadata_json` field replaces the separate `source_file` column from v1.
It can hold any extraction metadata: page, sheet name, row range, etc.
This makes the schema forward-compatible with new file formats.
"""

import json
from core.supabase_client import get_supabase_client
from core.config import settings


async def store_chunks(embedded_chunks: list[dict]) -> int:
    """
    Insert embedded chunks into the `document_chunks` table.

    Each row contains the chunk text, its 768-float embedding vector,
    and a metadata_json blob with source details (filename, page, etc.).

    Uses upsert on `id` so re-processing a document safely overwrites
    old chunks rather than creating duplicates.

    Args:
        embedded_chunks (list[dict]): Output from the embedder service.
            Required keys per dict:
                chunk_id      str   — UUID for this chunk
                document_id   str   — parent document UUID
                company_id    str   — owning company UUID/identifier
                text          str   — chunk text content
                embedding     list[float] — 768-dimensional vector
                chunk_index   int   — position in document
                page_number   int|None
                source_file   str   — original filename
                metadata      dict  — any extra extraction metadata

    Returns:
        int: Number of chunks inserted.
    """
    sb = get_supabase_client()

    rows = []
    for chunk in embedded_chunks:
        # Build metadata_json from available chunk metadata
        # This consolidates source_file, page_number, and any format-specific
        # info (sheet name for XLSX, row index for CSV) into one JSONB field
        metadata = {
            "source_file": chunk.get("source_file", "unknown"),
            "page_number": chunk.get("page_number"),
            "chunk_index": chunk.get("chunk_index", 0),
            # Additional format-specific metadata (e.g. sheet_name for XLSX)
            **chunk.get("extra_metadata", {}),
        }

        rows.append(
            {
                "id": chunk["chunk_id"],
                "document_id": chunk["document_id"],
                "company_id": chunk["company_id"],
                "chunk_text": chunk["text"],             # spec column name: chunk_text
                "chunk_index": chunk["chunk_index"],
                "page_number": chunk.get("page_number"),
                "embedding_id": f"gemini/{chunk['chunk_id']}",  # label referencing model + chunk
                "metadata_json": json.dumps(metadata),
                "embedding": chunk["embedding"],
            }
        )

    result = sb.table("document_chunks").upsert(rows).execute()
    return len(rows)


async def store_document_record(
    document_id: str,
    company_id: str,
    uploaded_by: str,
    file_name: str,
    file_type: str,
    file_url: str,
    business_line: str | None = None,
    department: str | None = None,
    category: str | None = None,
    tags: list[str] | None = None,
    access_level: str = "company",
) -> None:
    """
    Insert or update a document record in the `documents` table.

    Called after a file is uploaded to Supabase Storage.
    Sets initial processing_status to "Uploaded".

    Args:
        document_id:   Pre-generated UUID for the document.
        company_id:    UUID of the owning company.
        uploaded_by:   UUID of the user who uploaded the file.
        file_name:     Original filename (e.g. "Q3_Report.pdf").
        file_type:     Normalised format string (e.g. "PDF", "DOCX").
        file_url:      Supabase Storage path returned by the storage service.
        business_line: Optional business line classification.
        department:    Optional department label.
        category:      Optional document category.
        tags:          Optional list of tags for search/filtering.
        access_level:  Who can access this document ("company", "department", "private").
    """
    sb = get_supabase_client()

    sb.table("documents").upsert(
        {
            "id": document_id,
            "company_id": company_id,
            "uploaded_by": uploaded_by,
            "file_name": file_name,
            "file_type": file_type,
            "file_url": file_url,
            "business_line": business_line,
            "department": department,
            "category": category,
            "tags": tags or [],
            "access_level": access_level,
            "processing_status": "Uploaded",  # Initial status per spec
            "summary": None,
        }
    ).execute()


async def update_document_summary(document_id: str, summary: str) -> None:
    """
    Save an AI-generated summary to the document record.

    Called after the pipeline completes (status = "AI Ready").
    The summary is generated by Gemini from the first batch of chunks.

    Args:
        document_id: UUID of the document.
        summary:     Plain-text summary produced by Gemini.
    """
    sb = get_supabase_client()
    sb.table("documents").update({"summary": summary}).eq("id", document_id).execute()


async def vector_search(
    query_embedding: list[float],
    company_id: str,
    top_k: int = settings.TOP_K_CHUNKS,
    document_ids: list[str] | None = None,
) -> list[dict]:
    """
    Search the vector database for the most semantically similar chunks.

    Calls the `match_documents` PostgreSQL RPC function, which computes
    cosine similarity between the query vector and all stored chunk vectors,
    filtered by company. Returns the top-K closest chunks.

    Args:
        query_embedding: 768-float vector of the user's question.
        company_id:      Only return chunks from this company (access control).
        top_k:           Number of chunks to return.

    Returns:
        list[dict]: Top-K chunks with text, metadata_json, and similarity score.
            Each dict contains: id, document_id, company_id, chunk_text,
            chunk_index, page_number, metadata_json, similarity.
    """
    sb = get_supabase_client()

    params = {
        "query_embedding": query_embedding,
        "match_count": top_k,
        "filter_company": company_id,
        "filter_documents": document_ids,   # None = search all, list = chat scope
    }

    result = sb.rpc("match_documents", params).execute()
    return result.data or []


async def delete_chunks_by_document(document_id: str) -> int:
    """
    Delete all chunks for a document from the vector database.

    Called before reprocessing or when a document is deleted.

    Args:
        document_id: UUID of the document whose chunks should be removed.

    Returns:
        int: Number of chunk rows deleted.
    """
    sb = get_supabase_client()

    result = (
        sb.table("document_chunks")
        .delete()
        .eq("document_id", document_id)
        .execute()
    )

    return len(result.data) if result.data else 0


async def delete_document_record(document_id: str) -> None:
    """
    Delete the document metadata record from the `documents` table.

    This is called alongside delete_chunks_by_document() when a document
    is fully removed. The file in Supabase Storage is deleted separately
    by the storage service.

    Args:
        document_id: UUID of the document to remove.
    """
    sb = get_supabase_client()
    sb.table("documents").delete().eq("id", document_id).execute()


async def list_company_documents(company_id: str) -> list[dict]:
    """
    Fetch all document records for a company, ordered by most recent first.

    Used by the `GET /documents` endpoint. Returns full document metadata
    including current processing_status so the frontend can show progress.

    Args:
        company_id: Filter to this company's documents only.

    Returns:
        list[dict]: Document metadata records from the `documents` table.
    """
    sb = get_supabase_client()

    result = (
        sb.table("documents")
        .select(
            "id, company_id, uploaded_by, file_name, file_type, file_url, "
            "business_line, department, category, tags, access_level, "
            "processing_status, summary, created_at"
        )
        .eq("company_id", company_id)
        .order("created_at", desc=True)
        .execute()
    )

    return result.data or []


async def get_document_by_id(document_id: str) -> dict | None:
    """
    Fetch a single document record by its UUID.

    Used by the process endpoint to verify the document exists before
    starting the pipeline.

    Args:
        document_id: Document UUID.

    Returns:
        dict: Document record, or None if not found.
    """
    sb = get_supabase_client()

    result = (
        sb.table("documents")
        .select("*")
        .eq("id", document_id)
        .limit(1)
        .execute()
    )

    return result.data[0] if result.data else None