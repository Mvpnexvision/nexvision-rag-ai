"""
app/insight/router.py
======================
Insight Module — FastAPI Router (v4)

Replaces the v3 reasoning/rag module entirely.

Endpoints:
    POST  /chat/new                    Create a new chat session
    POST  /chat/{chat_id}/documents    Link existing documents to a chat
    GET   /chat/{chat_id}              Get chat metadata + document list
    GET   /chat/{chat_id}/messages     Get all questions/answers for a chat
    GET   /chat                        Get all chats for a company admin

    POST  /ai/chat                     Ask a question (runs full RAG pipeline)
    GET   /ai/questions                Get question history for a chat

    GET   /recommendations             List all recommendations for a company (JOINed with ai_questions)
    PATCH /recommendations/{id}        Update status only

All endpoints are company-scoped via current_user from JWT.
All endpoints visible in Swagger at: http://localhost:8000/docs
"""

import uuid
import json
from datetime import datetime, timezone
from fastapi import APIRouter, File, HTTPException, Query, Depends, UploadFile

from core.auth import CurrentUser, get_current_user
from core.supabase_client import get_supabase_client
from core.config import settings
from core.logger import debug_log

from app.insight.schemas import (
    ChatListItem,
    ChatListResponse,
    LinkDocumentsRequest,
    LinkDocumentsResponse,
    NewChatRequest,
    NewChatResponse,
    ChatMetadataResponse,
    AIChatRequest,
    AIChatResponse,
    AIQuestionRecord,
    AIQuestionsListResponse,
    RecommendationRecord,
    RecommendationsListResponse,
    RecommendationStatusUpdate,
)
from app.insight.services.pipeline import run_chat_pipeline

router = APIRouter()


# ── Helper: save ai_question to DB ────────────────────────────────────────────


async def _save_ai_question(
    chat_id: str,
    company_id: str,
    user_id: str,
    question: str,
    answer,  # AIOutputJSON
    has_insight: bool,
) -> str:
    """
    Persist an AI question + full AIOutputJSON output to the ai_questions table.

    In v4, ALL 9 output fields are saved (unlike v3 which dropped evidence_found,
    missing_data, business_impact, and next_action).

    Args:
        chat_id:     The chat session this question belongs to (required, NOT NULL in v4).
        company_id:  For multi-tenant scoping.
        user_id:     The asking user.
        question:    The raw question string.
        answer:      Validated AIOutputJSON from the pipeline.
        has_insight: Whether the BE determined this qualifies as an actionable insight.

    Returns:
        str: The generated UUID for the saved ai_questions row.
    """
    sb = get_supabase_client()
    question_id = str(uuid.uuid4())

    record = {
        "id": question_id,
        "chat_id": chat_id,
        "company_id": company_id,
        "user_id": user_id,
        "question": question,
        "answer": answer.direct_answer,
        "evidence_found": json.dumps(answer.evidence_found),
        "reasoning": answer.reasoning,
        "recommendation": answer.recommendation,
        "risk_level": answer.risk_level,
        "business_impact": answer.business_impact,
        "next_action": answer.next_action,
        "missing_data": json.dumps(answer.missing_data),
        "sources_json": json.dumps(answer.sources),
        "has_insight": has_insight,
    }

    try:
        sb.table("ai_questions").insert(record).execute()
        debug_log("REASONING", f"Saved ai_question {question_id} (has_insight={has_insight})")

        # Bump ai_chats.updated_at so list_chats sorts by most recently active
        sb.table("ai_chats").update(
            {"updated_at": datetime.now(timezone.utc).isoformat()}
        ).eq("id", chat_id).execute()
    except Exception as exc:
        # Don't fail the API response if the DB write fails — log and continue
        print(f"[WARN] Failed to save ai_question: {exc}")

    return question_id


async def _create_recommendation(
    ai_question_id: str,
    company_id: str,
) -> str:
    """
    Create a recommendations row linked to an ai_question.

    Only called when has_insight=True. The recommendations table in v4 is a
    thin tracking table — all content fields are read from ai_questions via FK.

    Args:
        ai_question_id: The UUID of the ai_questions row this insight came from.
        company_id:     For multi-tenant scoping and dashboard queries.

    Returns:
        str: The generated UUID for the new recommendations row.
    """
    sb = get_supabase_client()
    rec_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    record = {
        "id": rec_id,
        "ai_question_id": ai_question_id,
        "company_id": company_id,
        "status": "New",
        "created_at": now,
        "updated_at": now,
    }

    try:
        sb.table("recommendations").insert(record).execute()
        debug_log("REASONING", f"Created recommendation {rec_id} for question {ai_question_id}")
    except Exception as exc:
        print(f"[WARN] Failed to create recommendation: {exc}")

    return rec_id


# ── POST /chat/new ─────────────────────────────────────────────────────────────


@router.post(
    "/chat/new",
    response_model=NewChatResponse,
    summary="Create a new chat session",
    description=(
        "Creates a persistent chat session. The returned `chat_id` must be "
        "passed to all subsequent document uploads and questions in this conversation.\n\n"
        "Documents are attached per-chat, not per-company, so different chats "
        "can focus on different document sets."
    ),
)
async def create_chat(
    request: NewChatRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Create a new chat session and return its chat_id."""
    sb = get_supabase_client()
    chat_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    sb.table("ai_chats").insert({
        "id": chat_id,
        "company_id": request.company_id,
        "user_id": request.user_id,
        "title": request.title,
        "document_ids": json.dumps([]),
        "created_at": now,
        "updated_at": now,
    }).execute()

    debug_log("REASONING", f"Created chat {chat_id} for company {request.company_id}")

    return NewChatResponse(
        chat_id=chat_id,
        title=request.title,
        company_id=request.company_id,
    )


# ── POST /chat/{chat_id}/documents/link ─────────────────────────────────────────────


@router.post(
    "/chat/{chat_id}/documents/link", 
    response_model=LinkDocumentsResponse,
    summary="Link existing documents to a chat session",
    description=(
        "Link existing documents to a chat session by their UUIDs.\n\n"
        "This endpoint updates the ai_chats.document_ids list and also inserts "
        "into the ai_chat_documents junction table for accurate RAG scoping.\n\n"
        "If a document is already linked, it will be skipped without error."
    ),
)
async def link_documents_to_chat(
    chat_id: str,
    body: LinkDocumentsRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    sb = get_supabase_client()

    # Verify chat exists
    chat = sb.table("ai_chats").select("document_ids").eq("id", chat_id).limit(1).execute()
    if not chat.data:
        raise HTTPException(status_code=404, detail=f"Chat '{chat_id}' not found.")

    # Merge with existing IDs
    raw = chat.data[0].get("document_ids") or "[]"
    existing_ids = json.loads(raw) if isinstance(raw, str) else list(raw)
    all_ids = existing_ids + body.document_ids

    # Update ai_chats
    try:
        sb.table("ai_chats").update({
            "document_ids": json.dumps(all_ids),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", chat_id).execute()
    except Exception as exc:
        debug_log("REASONING", f"Failed to update ai_chats document_ids for chat {chat_id}: {exc}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to link documents to chat: {exc}",
        )

    # Insert into joint table — skip duplicates, log other failures
    failed_ids: list[str] = []
    for doc_id in body.document_ids:
        try:
            sb.table("ai_chat_documents").insert({
                "id": str(uuid.uuid4()),
                "chat_id": chat_id,
                "document_id": doc_id,
            }).execute()
        except Exception as exc:
            error_str = str(exc)
            if "duplicate" in error_str.lower() or "unique" in error_str.lower():
                # Already linked — not an error, skip silently
                debug_log("REASONING", f"Document {doc_id} already linked to chat {chat_id}, skipping.")
            else:
                # Genuine failure — log and collect for response
                debug_log("REASONING", f"Failed to insert ai_chat_documents row for doc {doc_id}: {exc}")
                failed_ids.append(doc_id)

    response = LinkDocumentsResponse(
        chat_id=chat_id,
        linked_document_ids=body.document_ids
    )

    if failed_ids:
        response["warnings"] = (
            f"{len(failed_ids)} document(s) failed to insert into ai_chat_documents "
            f"but were added to ai_chats.document_ids: {failed_ids}. "
            "Vector search will still work; the junction table may be out of sync."
        )

    return response

# ── GET /chat/{chat_id} ────────────────────────────────────────────────────────


@router.get(
    "/chat/{chat_id}",
    response_model=ChatMetadataResponse,
    summary="Get chat metadata",
    description="Returns the chat session details including its attached document_ids.",
)
async def get_chat(
    chat_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Fetch metadata for a single chat session."""
    sb = get_supabase_client()
    result = sb.table("ai_chats").select("*").eq("id", chat_id).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail=f"Chat '{chat_id}' not found.")

    row = result.data[0]
    raw_ids = row.get("document_ids") or "[]"
    doc_ids = json.loads(raw_ids) if isinstance(raw_ids, str) else list(raw_ids)

    return ChatMetadataResponse(
        chat_id=row["id"],
        title=row.get("title", "New Chat"),
        company_id=row["company_id"],
        user_id=row["user_id"],
        document_ids=doc_ids,
        created_at=str(row.get("created_at", "")),
        updated_at=str(row.get("updated_at", "")),
    )


# ── GET /chat/{chat_id}/messages ───────────────────────────────────────────────


@router.get(
    "/chat/{chat_id}/messages",
    response_model=AIQuestionsListResponse,
    summary="Get all questions and answers for a chat",
    description="Returns the full question/answer history for a chat, ordered oldest first.",
)
async def get_chat_messages(
    chat_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Retrieve the message history for a chat session."""
    sb = get_supabase_client()
    result = (
        sb.table("ai_questions")
        .select("*")
        .eq("chat_id", chat_id)
        .order("created_at", desc=False)
        .execute()
    )

    questions = _map_ai_question_rows(result.data or [])
    return AIQuestionsListResponse(
        chat_id=chat_id,
        questions=questions,
        total=len(questions),
    )

# ── GET /chat ──────────────────────────────────────────────────────────────────

@router.get(
    "/chat",
    response_model=ChatListResponse,
    summary="List all chat sessions for a user",
    description=(
        "Returns all chat sessions belonging to the authenticated user "
        "within a company, ordered by most recently updated first.\n\n"
        "Use `limit` and `offset` for pagination."
    ),
)
async def list_chats(
    company_id: str = Query(..., description="UUID of the company"),
    limit: int = Query(default=20, ge=1, le=100, description="Results per page"),
    offset: int = Query(default=0, ge=0, description="Pagination offset"),
    current_user: CurrentUser = Depends(get_current_user),
):
    """List paginated chat sessions for the current user within a company."""
    sb = get_supabase_client()

    # Count total for pagination metadata
    count_result = (
        sb.table("ai_chats")
        .select("id", count="exact")
        .eq("company_id", company_id)
        .eq("user_id", current_user.id)
        .execute()
    )
    total = count_result.count or 0

    # Fetch paginated rows
    result = (
        sb.table("ai_chats")
        .select("id, company_id, user_id, title, document_ids, created_at, updated_at")
        .eq("company_id", company_id)
        .eq("user_id", current_user.id)
        .order("updated_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    chats: list[ChatListItem] = []
    for row in result.data or []:
        raw_ids = row.get("document_ids") or "[]"
        doc_ids = json.loads(raw_ids) if isinstance(raw_ids, str) else list(raw_ids)

        chats.append(ChatListItem(
            chat_id=row["id"],
            title=row.get("title", "New Chat"),
            company_id=row["company_id"],
            user_id=row["user_id"],
            document_ids=doc_ids,
            created_at=str(row.get("created_at", "")),
            updated_at=str(row.get("updated_at", "")),
        ))

    return ChatListResponse(
        user_id=current_user.id,
        company_id=company_id,
        chats=chats,
        total=total,
        limit=limit,
        offset=offset,
    )


# ── POST /ai/chat ──────────────────────────────────────────────────────────────


@router.post(
    "/ai/chat",
    response_model=AIChatResponse,
    summary="Ask a question about chat documents",
    description=(
        "The core NexVision RAG endpoint (v4).\n\n"
        "Submits a question scoped to the documents attached to a specific chat session. "
        "The pipeline embeds the question, searches the chat's documents via pgvector, "
        "injects any .md context files, calls Gemini, and returns structured output.\n\n"
        "**The `has_insight` field** determines whether the answer qualifies as an "
        "actionable insight. When `true`, a recommendations row is created and "
        "`recommendation_id` is returned. When `false`, `recommendation_id` is null.\n\n"
        "The frontend should always render the `answer` as a chat message, and "
        "render an insight card only when `has_insight = true`."
    ),
)
async def ai_chat(
    request: AIChatRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Run the full RAG pipeline for a chat question.

    1. Embed question + vector search scoped to chat documents
    2. Load .md context files and inject into prompt
    3. Call Gemini, parse AIOutputJSON
    4. Determine has_insight
    5. Save ai_question row (all 9 output fields)
    6. If has_insight: create recommendations row
    7. Return full AIChatResponse
    """
    # Run the pipeline
    try:
        result = await run_chat_pipeline(
            question=request.question,
            chat_id=request.chat_id,
            company_id=request.company_id,
        )
    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        error_str = str(exc)

        # Classify the error for the frontend
        if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
            user_message = (
                "AI quota exceeded. The Gemini free tier limit has been reached. "
                "Please wait and try again, or upgrade your Gemini API plan."
            )
            status_code = 429
        elif "quota" in error_str.lower():
            user_message = "AI service quota exceeded. Please try again later."
            status_code = 429
        else:
            user_message = f"AI pipeline failed: {error_str}"
            status_code = 500

        raise HTTPException(status_code=status_code, detail=user_message)

    answer = result["answer"]
    has_insight = result["has_insight"]
    chunks_used = result["chunks_used"]

    # Save ai_question with all fields
    question_id = await _save_ai_question(
        chat_id=request.chat_id,
        company_id=request.company_id,
        user_id=request.user_id,
        question=request.question,
        answer=answer,
        has_insight=has_insight,
    )

    # Create recommendation row if this qualifies as an insight
    recommendation_id: str | None = None
    if has_insight:
        recommendation_id = await _create_recommendation(
            ai_question_id=question_id,
            company_id=request.company_id,
        )

    return AIChatResponse(
        question_id=question_id,
        chat_id=request.chat_id,
        question=request.question,
        company_id=request.company_id,
        user_id=request.user_id,
        answer=answer,
        has_insight=has_insight,
        recommendation_id=recommendation_id,
        chunks_used=chunks_used,
    )


# ── GET /ai/questions ──────────────────────────────────────────────────────────


@router.get(
    "/ai/questions",
    response_model=AIQuestionsListResponse,
    summary="Get AI question history for a chat",
    description=(
        "Returns all questions asked in a specific chat session, newest first. "
        "In v4 this requires `chat_id` — questions are always scoped to a chat."
    ),
)
async def get_ai_questions(
    chat_id: str = Query(..., description="UUID of the chat to fetch history for"),
    limit: int = Query(default=50, ge=1, le=200),
    current_user: CurrentUser = Depends(get_current_user),
):
    """List all Q&A records for a chat session."""
    sb = get_supabase_client()
    result = (
        sb.table("ai_questions")
        .select("*")
        .eq("chat_id", chat_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    questions = _map_ai_question_rows(result.data or [])
    return AIQuestionsListResponse(
        chat_id=chat_id,
        questions=questions,
        total=len(questions),
    )


def _map_ai_question_rows(rows: list[dict]) -> list[AIQuestionRecord]:
    """
    Map raw ai_questions DB rows into AIQuestionRecord objects.

    Handles JSONB fields stored as strings (evidence_found, missing_data, sources_json).
    """
    out: list[AIQuestionRecord] = []
    for r in rows:
        def _parse_jsonb(val) -> list:
            if isinstance(val, list):
                return val
            if isinstance(val, str):
                try:
                    return json.loads(val)
                except (json.JSONDecodeError, TypeError):
                    return []
            return []

        out.append(AIQuestionRecord(
            id=r["id"],
            chat_id=r.get("chat_id", ""),
            company_id=r["company_id"],
            user_id=r.get("user_id", ""),
            question=r["question"],
            answer=r.get("answer", ""),
            evidence_found=_parse_jsonb(r.get("evidence_found", [])),
            reasoning=r.get("reasoning", ""),
            recommendation=r.get("recommendation", ""),
            risk_level=r.get("risk_level", "Low"),
            business_impact=r.get("business_impact", ""),
            next_action=r.get("next_action", ""),
            missing_data=_parse_jsonb(r.get("missing_data", [])),
            sources_json=_parse_jsonb(r.get("sources_json", [])),
            has_insight=bool(r.get("has_insight", False)),
            created_at=str(r.get("created_at", "")),
        ))
    return out


# ── GET /recommendations ───────────────────────────────────────────────────────


@router.get(
    "/recommendations",
    response_model=RecommendationsListResponse,
    summary="List recommendations for a company",
    description=(
        "Returns all recommendations, with AI content from ai_questions via JOIN. "
        "The recommendations table stores only tracking fields (status, assignee, etc.). "
        "All AI-generated content comes from the linked ai_questions row."
    ),
)
async def list_recommendations(
    company_id: str = Query(..., description="UUID of the company"),
    limit: int = Query(default=50, ge=1, le=200),
    status: str | None = Query(default=None, description="Filter by status"),
    current_user: CurrentUser = Depends(get_current_user),
):
    """Fetch all recommendations for a company, joined with ai_questions content."""
    sb = get_supabase_client()

    query = (
        sb.table("recommendations")
        .select(
            "id, ai_question_id, company_id, status, created_at, updated_at, "
            "ai_questions(question, answer, evidence_found, reasoning, recommendation, "
            "risk_level, business_impact, next_action, sources_json)"
        )
        .eq("company_id", company_id)
        .order("created_at", desc=True)
        .limit(limit)
    )

    if status:
        query = query.eq("status", status)

    result = query.execute()
    records: list[RecommendationRecord] = []

    for r in result.data or []:
        aq = r.get("ai_questions") or {}

        def _parse_jsonb(val) -> list:
            if isinstance(val, list):
                return val
            if isinstance(val, str):
                try:
                    return json.loads(val)
                except (json.JSONDecodeError, TypeError):
                    return []
            return []

        records.append(RecommendationRecord(
            id=r["id"],
            ai_question_id=r.get("ai_question_id", ""),
            company_id=r.get("company_id", ""),
            status=r.get("status", "New"),
            created_at=str(r.get("created_at", "")),
            updated_at=str(r.get("updated_at", "")),
            # AI content from JOIN
            question=aq.get("question", ""),
            direct_answer=aq.get("answer", ""),
            evidence_found=_parse_jsonb(aq.get("evidence_found", [])),
            reasoning=aq.get("reasoning", ""),
            recommendation=aq.get("recommendation", ""),
            risk_level=aq.get("risk_level", "Low"),
            business_impact=aq.get("business_impact", ""),
            next_action=aq.get("next_action", ""),
            sources=_parse_jsonb(aq.get("sources_json", [])),
        ))

    return RecommendationsListResponse(
        company_id=company_id,
        recommendations=records,
        total=len(records),
    )


# ── PATCH /recommendations/{id} ───────────────────────────────────────────────


@router.patch(
    "/recommendations/{recommendation_id}",
    summary="Update recommendation status",
    description=(
        "Update the status of a recommendation.\n\n"
        "AI-generated content (question, reasoning, recommendation text, risk_level, etc.) "
        "is immutable and cannot be updated via this endpoint."
    ),
)
async def update_recommendation(
    recommendation_id: str,
    update: RecommendationStatusUpdate,
    current_user: CurrentUser = Depends(get_current_user),
):
    sb = get_supabase_client()

    result = (
        sb.table("recommendations")
        .update({
            "status": update.status,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
        .eq("id", recommendation_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail=f"Recommendation '{recommendation_id}' not found.",
        )

    return {"status": "updated", "recommendation_id": recommendation_id}