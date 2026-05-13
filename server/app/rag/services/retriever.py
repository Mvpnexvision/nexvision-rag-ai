"""
modules/rag_module/services/retriever.py
=========================================
STAGE 5 of the pipeline: Retrieve

Responsibility: Embed the user's question and retrieve the most semantically
relevant document chunks from the Supabase pgvector database.

Schema alignment (v2):
    - Reads `chunk_text` (not `text`) from vector_search results
    - Reads `metadata_json` for source_file, page_number, and extra metadata
    - Returns typed RetrievedChunk objects with these fields mapped correctly
"""

import json
from app.document.services.embedder import embed_single_text
from app.document.services.vector_store import vector_search
from app.rag.schemas import RetrievedChunk


async def retrieve_relevant_chunks(
    question: str,
    company_id: str,
    top_k: int = 5,
) -> list[RetrievedChunk]:
    """
    Embed the user's question and retrieve the most relevant document chunks.

    Flow:
        question (str)
            → Gemini text-embedding-004 (RETRIEVAL_QUERY task type)
            → 768-float query vector
            → Supabase pgvector cosine similarity search
            → top_k chunks ranked by semantic closeness

    The retriever has no awareness of what the AI will do with these chunks.
    It finds the right pages. The generator reads them. Clean separation.

    Args:
        question (str):    User's natural language question.
        company_id (str):  Scopes search to this company's data only.
                           This is the primary access control boundary.
        top_k (int):       Number of chunks to return (default: 5).

    Returns:
        list[RetrievedChunk]: Ranked chunks, most relevant first.
            Each includes: chunk_id, chunk_text, source_file, page_number,
            metadata (dict with extra context), similarity (0–1).

    Example:
        chunks = await retrieve_relevant_chunks(
            "What is our Q3 cash flow risk?", "acme_corp_uuid", top_k=5
        )
        # chunks[0].chunk_text → "Accounts payable overdue by 45 days..."
        # chunks[0].source_file → "Q3_Financial_Report.pdf"
        # chunks[0].similarity → 0.94
    """

    # Step 1: Convert question to a 768-float vector using Gemini embedding
    # RETRIEVAL_QUERY task type is paired with RETRIEVAL_DOCUMENT used at index time
    query_vector: list[float] = await embed_single_text(
        question, task_type="RETRIEVAL_QUERY"
    )

    # Step 2: Cosine similarity search in Supabase pgvector
    raw_chunks: list[dict] = await vector_search(
        query_embedding=query_vector,
        company_id=company_id,
        top_k=top_k,
    )

    # Step 3: Map raw DB rows → typed RetrievedChunk models
    chunks: list[RetrievedChunk] = []
    for c in raw_chunks:
        # Parse metadata_json — stored as a JSON string in the DB
        raw_meta = c.get("metadata_json")
        if isinstance(raw_meta, str):
            try:
                meta = json.loads(raw_meta)
            except (json.JSONDecodeError, TypeError):
                meta = {}
        elif isinstance(raw_meta, dict):
            meta = raw_meta
        else:
            meta = {}

        chunks.append(
            RetrievedChunk(
                chunk_id=str(c.get("id", "")),
                chunk_text=c.get("chunk_text", ""),          # ← v2 column name
                source_file=meta.get("source_file", "unknown"),
                page_number=c.get("page_number") or meta.get("page_number"),
                metadata=meta,
                similarity=float(c.get("similarity", 0.0)),
            )
        )

    return chunks