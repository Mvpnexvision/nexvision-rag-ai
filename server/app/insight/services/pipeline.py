"""
app/insight/services/pipeline.py
=================================
The core RAG pipeline for a single AI chat turn (v4).

This file replaces both:
  - app/rag/services/retriever.py  (embedding + vector search)
  - app/reasoning/services/generator.py  (prompt building + Gemini call)

The pipeline is called once per user message in POST /ai/chat.

Flow:
    1. Load chat from DB → get document_ids list
    2. Fetch .md context file content from Supabase Storage (if any in this chat)
    3. Embed question using RETRIEVAL_QUERY task type (Gemini gemini-embedding-001)
    4. Run match_documents() RPC scoped to document_ids
    5. Delegate to generator.py to build prompt and call Gemini
    6. Parse AIOutputJSON from Gemini response
    7. Determine has_insight from the AI output fields
    8. Return structured result dict

has_insight logic (see new-changes.md Section 6 for canonical spec):
    True when ALL of:
        - missing_data is empty (or contains only minor/non-critical gaps)
        - recommendation is not empty
        - risk_level is not None
        - direct_answer does NOT contain phrases indicating inability to answer
    False otherwise.
"""

import json
from core.supabase_client import get_supabase_client
from core.config import settings
from app.document.services.embedder import embed_single_text
from app.document.services.vector_store import vector_search
from app.insight.services.generator import build_and_call_gemini
from app.insight.schemas import AIOutputJSON


# Phrases in direct_answer that indicate the AI could not answer from context.
# If any of these appear (case-insensitive), has_insight is forced to False.
_CANNOT_ANSWER_PHRASES = [
    "not enough data",
    "cannot determine",
    "no relevant documents",
    "not related",
    "unable to answer",
    "insufficient information",
    "no information available",
    "cannot be determined",
]


def _determine_has_insight(output: AIOutputJSON) -> bool:
    """
    Apply the has_insight rule from new-changes.md Section 9.

    The BE — not the AI — decides whether a full actionable insight exists.
    This keeps the logic consistent regardless of how the AI phrases its response.

    Args:
        output: Parsed AIOutputJSON from the Gemini response.

    Returns:
        bool: True if all conditions for a complete insight are met.
    """
    # Condition 1: recommendation must be present
    if not output.recommendation or not output.recommendation.strip():
        return False

    # Condition 2: missing_data should be empty
    # (A non-empty list means the AI flagged critical gaps)
    if output.missing_data:
        return False

    # Condition 3: direct_answer must not contain "I cannot answer" language
    answer_lower = output.direct_answer.lower()
    for phrase in _CANNOT_ANSWER_PHRASES:
        if phrase in answer_lower:
            return False

    return True


async def _load_chat(chat_id: str) -> dict:
    """
    Fetch chat metadata from the DB, including the document_ids list.

    Args:
        chat_id: UUID of the chat session.

    Returns:
        dict: The chat row from ai_chats.

    Raises:
        ValueError: If the chat is not found.
    """
    sb = get_supabase_client()
    result = (
        sb.table("ai_chats")
        .select("id, company_id, user_id, title, document_ids, created_at, updated_at")
        .eq("id", chat_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise ValueError(f"Chat '{chat_id}' not found.")
    return result.data[0]


async def _load_md_context(document_ids: list[str]) -> str:
    """
    Load the content of any .md context files attached to this chat.

    .md files are stored as-is in Supabase Storage and injected directly into
    the prompt as [BUSINESS CONTEXT]. They do NOT go through the RAG pipeline.

    If multiple .md files exist, their content is concatenated with a separator.

    Args:
        document_ids: List of document UUIDs attached to the chat.

    Returns:
        str: Concatenated plain-text content of all .md context files,
             or an empty string if none exist.
    """
    if not document_ids:
        return ""

    sb = get_supabase_client()

    # Find .md context files among the chat's documents
    result = (
        sb.table("documents")
        .select("id, file_url, file_name")
        .in_("id", document_ids)
        .eq("is_context_file", True)
        .execute()
    )

    if not result.data:
        return ""

    bucket = settings.SUPABASE_STORAGE_BUCKET
    parts: list[str] = []

    for doc in result.data:
        try:
            raw_bytes: bytes = sb.storage.from_(bucket).download(doc["file_url"])
            # .md files are plain UTF-8 text
            try:
                content = raw_bytes.decode("utf-8").strip()
            except UnicodeDecodeError:
                content = raw_bytes.decode("latin-1").strip()

            if content:
                parts.append(f"--- {doc['file_name']} ---\n{content}")
        except Exception:
            # If a context file can't be read, skip it silently
            # (don't fail the whole pipeline over a missing context file)
            continue

    return "\n\n".join(parts)


async def run_chat_pipeline(
    question: str,
    chat_id: str,
    company_id: str,
    top_k: int = settings.TOP_K_CHUNKS,
) -> dict:
    """
    Execute the full RAG pipeline for one AI chat turn.

    This is the single entry point called by the /ai/chat endpoint.
    It orchestrates embedding, retrieval, context loading, and generation.

    Args:
        question:   The user's natural language question.
        chat_id:    UUID of the chat session (used to scope document retrieval).
        company_id: UUID of the company (used as an additional access control layer).
        top_k:      Number of vector chunks to retrieve (defaults to server config).

    Returns:
        dict with keys:
            answer      (AIOutputJSON): The structured AI response.
            has_insight (bool):         Whether the response qualifies as an insight.
            chunks_used (int):          Number of chunks passed to the AI.

    Raises:
        ValueError: If the chat is not found.
        HTTPException: Propagated from vector search or Gemini call failures.
    """
    # Step 1: Load chat → get document_ids for scoping
    chat = await _load_chat(chat_id)
    raw_doc_ids = chat.get("document_ids") or []

    # document_ids may be stored as a JSON string in the DB (jsonb column)
    if isinstance(raw_doc_ids, str):
        try:
            document_ids: list[str] = json.loads(raw_doc_ids)
        except (json.JSONDecodeError, TypeError):
            document_ids = []
    else:
        document_ids = list(raw_doc_ids)

    # Step 2: Load .md context files for this chat
    md_context = await _load_md_context(document_ids)

    # Step 3: Embed question as a retrieval query
    # RETRIEVAL_QUERY is paired with RETRIEVAL_DOCUMENT used at index time
    query_vector: list[float] = await embed_single_text(
        question, task_type="RETRIEVAL_QUERY"
    )

    # Step 4: Retrieve most relevant chunks, scoped to this chat's documents
    raw_chunks: list[dict] = await vector_search(
        query_embedding=query_vector,
        company_id=company_id,
        top_k=top_k,
        document_ids=document_ids if document_ids else None,
    )

    # Step 5: Build prompt and call Gemini via generator
    output: AIOutputJSON = await build_and_call_gemini(
        question=question,
        chunks=raw_chunks,
        md_context=md_context,
    )

    # Step 6: Determine has_insight from the AI output
    has_insight = _determine_has_insight(output)

    return {
        "answer": output,
        "has_insight": has_insight,
        "chunks_used": len(raw_chunks),
    }