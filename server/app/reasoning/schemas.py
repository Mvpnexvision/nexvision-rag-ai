"""
app/reasoning/schemas.py
==============================
Request and response schemas for the RAG Module.

Aligned to `ai_questions` table spec:
    company_id, user_id, question, answer, reasoning,
    recommendation, risk_level, sources_json, created_at

And to the agreed NexVision JSON insight output contract.
"""

from pydantic import BaseModel, Field
from typing import Literal
from enum import Enum
from app.rag.schemas import RetrievedChunk


# ── Chat (AI Chat) ─────────────────────────────────────────────────────────────

class AIChatRequest(BaseModel):
    """
    Request body for POST /ai/chat.
    Submits a business question to the RAG pipeline.
    """

    question: str = Field(
        ...,
        min_length=5,
        description="The business question to answer using company documents.",
        examples=["What vendors have overdue invoices this quarter?"],
    )
    company_id: str = Field(
        ...,
        description="UUID of the company — scopes retrieval to this company's documents only.",
    )
    user_id: str = Field(
        ...,
        description="UUID of the asking user (Supabase Auth UID) — saved to ai_questions table.",
    )
    top_k: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Number of document chunks to retrieve. Higher = more context, slower.",
    )


class InsightStatus(str, Enum):
    new = "New"
    in_review = "In Review"
    accepted = "Accepted"
    rejected = "Rejected"
    completed = "Completed"


class NexVisionInsight(BaseModel):
    """
    The structured AI insight — core output of NexVision.
    Used by /ai/chat — original format per Section 12 of the spec.

    {
        "direct_answer": "",
        "evidence_found": [],
        "reasoning": "",
        "recommendation": "",
        "risk_level": "Low | Medium | High | Critical",
        "business_impact": "",
        "next_action": "",
        "missing_data": [],
        "sources": []
    }
    """

    direct_answer: str = Field(
        ...,
        description="Concise 1–2 sentence answer to the user's question.",
    )
    evidence_found: list[str] = Field(
        ...,
        description="Specific facts found in the retrieved document chunks.",
    )
    reasoning: str = Field(
        ...,
        description="Step-by-step explanation of how the conclusion was reached.",
    )
    recommendation: str = Field(
        ...,
        description="Practical, specific business recommendation based on evidence.",
    )
    risk_level: Literal["Low", "Medium", "High", "Critical"] = Field(
        ...,
        description="Assessed risk level for the current situation.",
    )
    business_impact: str = Field(
        ...,
        description="Consequence to the business if no action is taken.",
    )
    next_action: str = Field(
        ...,
        description="The single most important immediate action, with owner and timeline.",
    )
    missing_data: list[str] = Field(
        default_factory=list,
        description="Data that would improve this analysis but was not found in documents.",
    )
    sources: list[str] = Field(
        ...,
        description="Citations: 'filename, page N' for every claim made.",
    )


class NexVisionInsightCard(NexVisionInsight):
    """
    Extended insight — used by /insights/generate.
    Adds AI Insights card fields per Section 15 of the spec.
    Inherits all 9 fields from NexVisionInsight and adds 3 more.
    """

    title: str = Field(
        default="",
        description="Short issue title e.g. Truck 03 PMS Overdue.",
    )
    suggested_deadline: str = Field(
        default="",
        description="When action should be taken e.g. Within 3 days.",
    )
    status: InsightStatus = Field(
        default=InsightStatus.new,
        description="New, In Review, Accepted, Rejected, or Completed.",
    )


class AIChatResponse(BaseModel):
    """
    Full response from POST /ai/chat.
    Includes the structured insight and the raw chunks that informed it.
    """

    question_id: str = Field(..., description="UUID of the saved ai_questions record")
    question: str
    company_id: str
    user_id: str
    insight: NexVisionInsight
    retrieved_chunks: list[RetrievedChunk] = Field(
        ...,
        description="Document chunks retrieved and used as AI context.",
    )
    chunks_used: int


# ── AI Questions history ───────────────────────────────────────────────────────

class AIQuestionRecord(BaseModel):
    """
    A single record from the `ai_questions` table.
    Returned by GET /ai/questions.
    """

    id: str
    company_id: str
    user_id: str
    question: str
    answer: str = Field(..., description="direct_answer from the insight")
    reasoning: str
    recommendation: str
    risk_level: str
    sources_json: list[str] = Field(default_factory=list)
    created_at: str


class AIQuestionsListResponse(BaseModel):
    """Response for GET /ai/questions."""

    company_id: str
    questions: list[AIQuestionRecord]
    total: int


# ── Insights generate ──────────────────────────────────────────────────────────

class InsightGenerateRequest(BaseModel):
    """
    Request body for POST /insights/generate.

    Similar to AIChatRequest but intended for generating deeper, proactive
    insights across a topic — not just answering a single question.
    The AI is prompted to surface risks and opportunities, not just answer.
    """

    topic: str = Field(
        ...,
        min_length=5,
        description=(
            "Business topic or area to analyse, e.g. 'vendor payment risk' or "
            "'Q3 financial performance'. The AI will generate a comprehensive insight."
        ),
        examples=["accounts payable risk this quarter"],
    )
    company_id: str = Field(..., description="UUID of the company")
    user_id: str = Field(..., description="UUID of the requesting user")
    top_k: int = Field(
        default=8,
        ge=1,
        le=20,
        description="Chunks to retrieve. Higher K gives broader context for insight generation.",
    )


class InsightGenerateResponse(BaseModel):
    """Response from POST /insights/generate."""

    question_id: str = Field(..., description="UUID of the saved ai_questions record")
    topic: str
    company_id: str
    insight: NexVisionInsightCard
    chunks_used: int
    message: str