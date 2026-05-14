"""
app/reasoning/router.py
============================
RAG & AI Module — FastAPI Router

Implements the spec'd API endpoints:
    POST /ai/chat              Ask a question → structured NexVision insight
    GET  /ai/questions         Retrieve question history for a company
    POST /insights/generate    Generate a proactive business insight on a topic

All endpoints:
    - Write results to the `ai_questions` table for history and audit
    - Scope data retrieval to the requesting company (access control)
    - Return structured NexVisionInsight JSON

Note: This router does NOT use a prefix — the /ai/ and /insights/ prefixes
are part of each route path directly, matching the spec's API surface.
"""

import uuid
import json
from fastapi import APIRouter, HTTPException, Query

from app.reasoning.schemas import (
    AIChatRequest,
    AIChatResponse,
    InsightGenerateRequest,
    InsightGenerateResponse,
    AIQuestionsListResponse,
    AIQuestionRecord,
)
from app.rag.services.retriever import retrieve_relevant_chunks
from app.reasoning.services.generator import generate_insight
from core.supabase_client import get_supabase_client

router = APIRouter()


# ---------------------------------------------------------------------------
# Shared helper: save insight to ai_questions table
# ---------------------------------------------------------------------------

async def _save_ai_question(
    company_id: str,
    user_id: str,
    question: str,
    insight,  # NexVisionInsight
) -> str:
    """
    Persist an AI question + insight to the `ai_questions` table.

    Returns the generated UUID for the saved record.
    This is called after every successful insight generation so that
    the GET /ai/questions endpoint has a full history to return.

    Maps NexVisionInsight fields to table columns:
        direct_answer   → answer
        reasoning       → reasoning
        recommendation  → recommendation
        risk_level      → risk_level
        sources         → sources_json (JSONB array)
    """
    sb = get_supabase_client()
    question_id = str(uuid.uuid4())

    record = {
        "id": question_id,
        "company_id": company_id,
        "user_id": user_id,
        "question": question,
        "answer": insight.direct_answer,
        "reasoning": insight.reasoning,
        "recommendation": insight.recommendation,
        "risk_level": insight.risk_level,
        "sources_json": json.dumps(insight.sources),  # stored as JSONB
    }

    try:
        sb.table("ai_questions").insert(record).execute()
    except Exception as exc:
        # Don't fail the API call if history write fails — log and continue
        # In production, replace with proper logging (e.g. structlog)
        print(f"[WARN] Failed to save ai_question to DB: {exc}")

    return question_id


# ---------------------------------------------------------------------------
# POST /ai/chat
# ---------------------------------------------------------------------------

@router.post(
    "/ai/chat",
    response_model=AIChatResponse,
    summary="Ask a question about company documents",
    description=(
        "The core NexVision RAG endpoint. Submits a business question and receives "
        "a structured AI insight grounded in the company's uploaded documents.\n\n"
        "**Full pipeline (per call):**\n"
        "1. Embed question → 1536-float vector (Gemini gemini-embedding-001)\n"
        "2. Cosine similarity search → top-K chunks (Supabase pgvector)\n"
        "3. Build prompt: system rules + chunks + question\n"
        "4. Gemini generates structured JSON insight\n"
        "5. Result saved to `ai_questions` table\n"
        "6. Return insight + raw chunks to client\n\n"
        "**The AI only uses retrieved document chunks — it does not use outside knowledge.**\n\n"
        "Requires at least one document with status `AI Ready` for the given company."
    ),
)
async def ai_chat(request: AIChatRequest):
    """
    Submit a business question and receive a structured NexVision insight.

    The AI grounds its answer entirely in the company's uploaded documents.
    Every claim is cited to a source file and page number.

    **Example questions:**
    - "What vendors have overdue invoices this quarter?"
    - "What are the key risks in our Q3 financial report?"
    - "Which departments exceeded budget last period?"

    **Response includes:**
    - `insight.direct_answer` — concise answer
    - `insight.evidence_found` — specific facts from documents
    - `insight.reasoning` — step-by-step AI reasoning
    - `insight.recommendation` — practical business action
    - `insight.risk_level` — Low / Medium / High / Critical
    - `insight.next_action` — immediate step with owner and timeline
    - `insight.sources` — file + page citations
    - `retrieved_chunks` — raw document segments used as context
    """
    # Step 1: Retrieve relevant chunks from vector database
    chunks = await retrieve_relevant_chunks(
        question=request.question,
        company_id=request.company_id,
        top_k=request.top_k,
    )

    if not chunks:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No AI-ready documents found for company '{request.company_id}'. "
                "Upload documents and ensure processing_status = 'AI Ready' before querying."
            ),
        )

    # Step 2: Generate structured insight from retrieved chunks
    insight = await generate_insight(
        question=request.question,
        chunks=chunks,
        mode="chat",
    )

    # Step 3: Persist to ai_questions table for history
    question_id = await _save_ai_question(
        company_id=request.company_id,
        user_id=request.user_id,
        question=request.question,
        insight=insight,
    )

    return AIChatResponse(
        question_id=question_id,
        question=request.question,
        company_id=request.company_id,
        user_id=request.user_id,
        insight=insight,
        retrieved_chunks=chunks,
        chunks_used=len(chunks),
    )


# ---------------------------------------------------------------------------
# GET /ai/questions
# ---------------------------------------------------------------------------

@router.get(
    "/ai/questions",
    response_model=AIQuestionsListResponse,
    summary="Retrieve AI question history for a company",
    description=(
        "Returns all questions asked by users in a company, along with the "
        "AI's answers, reasoning, recommendations, risk levels, and source citations.\n\n"
        "Ordered by most recent first. Useful for audit trails, dashboards, and "
        "allowing users to review past AI interactions."
    ),
)
async def get_ai_questions(
    company_id: str = Query(..., description="UUID of the company to fetch question history for"),
    limit: int = Query(default=50, ge=1, le=200, description="Maximum number of records to return"),
    user_id: str | None = Query(None, description="Optional: filter to questions from a specific user"),
):
    """
    List all AI questions and answers for a company.

    Optionally filter by user_id to show a specific user's history.
    Results are ordered newest first.
    """
    sb = get_supabase_client()

    query = (
        sb.table("ai_questions")
        .select("id, company_id, user_id, question, answer, reasoning, recommendation, risk_level, sources_json, created_at")
        .eq("company_id", company_id)
        .order("created_at", desc=True)
        .limit(limit)
    )

    # Optional user filter
    if user_id:
        query = query.eq("user_id", user_id)

    result = query.execute()
    records = result.data or []

    questions = []
    for r in records:
        # sources_json is stored as a JSON string → parse back to list
        raw_sources = r.get("sources_json", "[]")
        try:
            sources = json.loads(raw_sources) if isinstance(raw_sources, str) else raw_sources
        except (json.JSONDecodeError, TypeError):
            sources = []

        questions.append(
            AIQuestionRecord(
                id=r["id"],
                company_id=r["company_id"],
                user_id=r["user_id"],
                question=r["question"],
                answer=r.get("answer", ""),
                reasoning=r.get("reasoning", ""),
                recommendation=r.get("recommendation", ""),
                risk_level=r.get("risk_level", ""),
                sources_json=sources,
                created_at=str(r.get("created_at", "")),
            )
        )

    return AIQuestionsListResponse(
        company_id=company_id,
        questions=questions,
        total=len(questions),
    )


# ---------------------------------------------------------------------------
# POST /insights/generate
# ---------------------------------------------------------------------------

@router.post(
    "/insights/generate",
    response_model=InsightGenerateResponse,
    summary="Generate a proactive business insight on a topic",
    description=(
        "Unlike `/ai/chat` (which answers a specific question), this endpoint "
        "generates a **proactive, comprehensive insight** on a business topic.\n\n"
        "The AI is prompted to:\n"
        "- Surface hidden risks and systemic patterns\n"
        "- Identify opportunities in the data\n"
        "- Compare across time periods or categories where data exists\n"
        "- Provide a deeper, more analytical output than a direct Q&A\n\n"
        "Results are saved to the `ai_questions` table for history tracking.\n\n"
        "Example topics: 'vendor payment risk', 'Q3 financial performance', "
        "'HR attrition patterns', 'inventory turnover trends'"
    ),
)
async def generate_insight_endpoint(request: InsightGenerateRequest):
    """
    Generate a comprehensive, proactive business insight on a given topic.

    The AI retrieves all relevant document chunks for the topic and performs
    a deeper analysis — surfacing risks, patterns, and opportunities that
    a simple Q&A might miss.

    Use this for:
    - Management dashboard insights
    - Risk report generation
    - Proactive issue detection before a crisis
    - Strategic planning support
    """
    # Frame the topic as a structured analysis question for retrieval
    analysis_question = (
        f"Analyse all available information about: {request.topic}. "
        f"Identify risks, patterns, anomalies, and business implications."
    )

    # Retrieve chunks with a slightly higher top_k for broader coverage
    chunks = await retrieve_relevant_chunks(
        question=analysis_question,
        company_id=request.company_id,
        top_k=request.top_k,
    )

    if not chunks:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No relevant documents found for topic '{request.topic}' "
                f"in company '{request.company_id}'. "
                "Ensure relevant documents are uploaded and AI Ready."
            ),
        )

    # Generate insight in "insight" mode — proactive analysis, not just Q&A
    insight = await generate_insight(
        question=f"Provide a comprehensive business insight on: {request.topic}",
        chunks=chunks,
        mode="insight",
    )

    # Save to ai_questions table
    question_id = await _save_ai_question(
        company_id=request.company_id,
        user_id=request.user_id,
        question=f"[INSIGHT] {request.topic}",
        insight=insight,
    )

    return InsightGenerateResponse(
        question_id=question_id,
        topic=request.topic,
        company_id=request.company_id,
        insight=insight,
        chunks_used=len(chunks),
        message=(
            f"Insight generated for topic '{request.topic}'. "
            f"Based on {len(chunks)} document segments."
        ),
    )


# ---------------------------------------------------------------------------
# GET /ai/health — pipeline health check
# ---------------------------------------------------------------------------

@router.get(
    "/ai/health",
    summary="RAG pipeline health check",
    description="Confirms the AI pipeline dependencies (Gemini, Supabase) are configured.",
    tags=["Health"],
)
async def ai_health():
    """
    Verify the RAG & AI module is operational.

    Checks that all required environment variables are set.
    Does not make live API calls — use for deployment readiness checks.
    """
    from core.config import settings

    checks = {
        "supabase_url_configured": bool(settings.SUPABASE_URL),
        "supabase_service_key_configured": bool(settings.SUPABASE_SERVICE_KEY),
        "supabase_storage_bucket": settings.SUPABASE_STORAGE_BUCKET,
        "gemini_key_configured": bool(settings.GEMINI_API_KEY),
        "embedding_model": settings.GEMINI_EMBEDDING_MODEL,
        "chat_model": settings.GEMINI_CHAT_MODEL,
        "chunk_size": settings.CHUNK_SIZE,
        "chunk_overlap": settings.CHUNK_OVERLAP,
        "top_k_default": settings.TOP_K_CHUNKS,
    }

    all_ok = all([
        checks["supabase_url_configured"],
        checks["supabase_service_key_configured"],
        checks["gemini_key_configured"],
    ])

    return {
        "status": "ready" if all_ok else "misconfigured",
        "checks": checks,
    }