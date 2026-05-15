"""
app/reports/router.py
======================
Reports Module — FastAPI Router (v4)

Aligned with the v4 insight module architecture:
    - Uses CurrentUser auth (JWT via Supabase Auth)
    - Uses chat_id scoping (optional — falls back to company-wide)
    - Uses the same Gemini client as the insight module
    - Saves to `reports` table aligned with spec

Endpoints:
    POST /reports/generate     Generate a structured report from company documents
    GET  /reports              List all saved reports for a company
"""

import uuid
import json
import re
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query, Depends

from core.auth import CurrentUser, get_current_user
from core.supabase_client import get_supabase_client
from core.gemini_client import get_chat_model
from core.logger import debug_log

from app.reports.schemas import (
    ReportGenerateRequest,
    ReportGenerateResponse,
    ReportListResponse,
    ReportRecord,
    ReportContent,
    ReportType,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Report type → AI prompt and default title mapping
# ---------------------------------------------------------------------------

REPORT_PROMPTS = {
    "management_summary": (
        "Generate a comprehensive management summary of the company's current status. "
        "Cover overall business health, top risks, key findings, and recommendations for leadership."
    ),
    "hr_compliance": (
        "Analyse HR documents and identify compliance issues. "
        "Look for missing employee files, policy violations, attendance problems, "
        "and staff requiring NTE. List all findings with evidence and source citations."
    ),
    "sales_performance": (
        "Analyse sales data and performance reports. "
        "Identify top and bottom performing products, staff, or branches. "
        "Highlight revenue opportunities and areas needing immediate improvement."
    ),
    "logistics": (
        "Analyse logistics and fleet data. "
        "Identify overdue PMS schedules, delivery delays, driver issues, "
        "and client delivery performance. Flag all high-risk findings."
    ),
    "pms": (
        "Analyse all equipment and vehicle maintenance records. "
        "Identify equipment overdue for PMS, upcoming maintenance schedules, "
        "and breakdown risks. Prioritise by days overdue."
    ),
    "risk": (
        "Identify ALL high and critical risk issues across all company documents. "
        "List every finding that requires immediate management attention, "
        "with evidence, business impact, and recommended action."
    ),
}

REPORT_TITLES = {
    "management_summary": "Management Summary Report",
    "hr_compliance": "HR Compliance Report",
    "sales_performance": "Sales Performance Report",
    "logistics": "Logistics Report",
    "pms": "PMS & Maintenance Report",
    "risk": "Risk Report",
}


# ---------------------------------------------------------------------------
# Report generation system prompt
# ---------------------------------------------------------------------------

REPORT_SYSTEM_PROMPT = """
You are NexVision Reporting AI.
You generate structured business reports from company documents.

STRICT RULES:
1. Use ONLY the provided document context. Do not use outside knowledge.
2. Do not invent facts. If data is missing, list it in missing_data.
3. Always cite the source document for every finding.
4. Write in clear, professional business English.
5. Be direct and decision-focused.
6. Return ONLY valid JSON — no markdown fences, no preamble, no explanation.

Return exactly this JSON structure:
{
  "summary": "Executive summary in 2-3 sentences.",
  "key_findings": [
    "Finding 1 (Source: filename.pdf, page N)",
    "Finding 2 (Source: filename.xlsx, Sheet: Q3)"
  ],
  "risks": [
    "Risk 1 — High: description",
    "Risk 2 — Medium: description"
  ],
  "recommendations": [
    "Action 1: owner, timeline",
    "Action 2: owner, timeline"
  ],
  "missing_data": [
    "Document or data type not found but needed for complete analysis"
  ],
  "sources": [
    "filename.pdf, page 1",
    "spreadsheet.xlsx, Sheet: Q3"
  ]
}
""".strip()


# ---------------------------------------------------------------------------
# Helper: retrieve chunks scoped to chat or company
# ---------------------------------------------------------------------------

async def _get_chunks(
    company_id: str,
    topic: str,
    chat_id: str | None,
    top_k: int,
) -> list:
    """
    Retrieve relevant document chunks for report generation.

    If chat_id is provided, scopes retrieval to that chat's documents.
    Otherwise retrieves from all AI-ready company documents.

    Args:
        company_id: Company UUID for access control.
        topic:      The report analysis question used for embedding.
        chat_id:    Optional chat session UUID to scope retrieval.
        top_k:      Number of chunks to retrieve.

    Returns:
        list: Retrieved document chunks.
    """
    # Import here to avoid circular imports
    from app.rag.services.retriever import retrieve_relevant_chunks

    return await retrieve_relevant_chunks(
        question=topic,
        company_id=company_id,
        top_k=top_k,
    )


# ---------------------------------------------------------------------------
# Helper: call Gemini to generate report content
# ---------------------------------------------------------------------------

async def _generate_report_content(
    topic: str,
    chunks: list,
) -> ReportContent:
    """
    Build a report prompt from retrieved chunks and call Gemini.

    Args:
        topic:  The report-specific analysis question.
        chunks: Retrieved document chunks from Supabase Vector.

    Returns:
        ReportContent: Structured report with findings, risks, recommendations.

    Raises:
        HTTPException 500: If Gemini returns empty or unparseable response.
    """

    # Format chunks into a labelled context block
    context_parts = []
    for c in chunks:
        page_ref = f"Page {c.page_number}" if c.page_number else "Page N/A"
        source_line = f"[SOURCE: {c.source_file}, {page_ref}]"
        context_parts.append(f"{source_line}\n{c.chunk_text}")

    context = "\n\n".join(context_parts)

    full_prompt = (
        f"{REPORT_SYSTEM_PROMPT}\n\n"
        f"DOCUMENT CONTEXT (use ONLY this):\n{context}\n\n"
        f"REPORT TASK: {topic}\n\n"
        f"Respond with ONLY valid JSON. No markdown."
    )

    # Call Gemini
    model = get_chat_model()
    response = model.generate_content(full_prompt)

    if not response.text:
        raise HTTPException(
            status_code=500,
            detail="Gemini returned an empty response. Please try again."
        )

    # Strip markdown fences if Gemini adds them despite instructions
    raw = response.text.strip()
    raw = re.sub(r"```(?:json)?\s*", "", raw).strip()
    raw = re.sub(r"```\s*$", "", raw).strip()

    try:
        parsed = json.loads(raw)
        return ReportContent(**parsed)
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse report JSON from AI: {e}. First 300 chars: {raw[:300]}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Report content validation failed: {e}"
        )


# ---------------------------------------------------------------------------
# POST /reports/generate
# ---------------------------------------------------------------------------

@router.post(
    "/generate",
    response_model=ReportGenerateResponse,
    summary="Generate a structured business report",
    description=(
        "Generates a structured business report from uploaded company documents "
        "and saves it to the `reports` table.\n\n"
        "**Available report types:**\n"
        "- `management_summary` — Overall business health\n"
        "- `hr_compliance` — HR policy and compliance issues\n"
        "- `sales_performance` — Sales trends and performance\n"
        "- `logistics` — Delivery and fleet status\n"
        "- `pms` — Equipment maintenance schedule\n"
        "- `risk` — All high and critical risk findings\n\n"
        "Optionally scope to a specific chat session via `chat_id`."
    ),
)
async def generate_report(
    request: ReportGenerateRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Generate a structured report from company documents.

    1. Retrieve relevant chunks (scoped to chat or company-wide)
    2. Send chunks + report prompt to Gemini
    3. Parse structured ReportContent from AI response
    4. Save to `reports` table
    5. Return full report response
    """

    topic = REPORT_PROMPTS.get(request.report_type.value, "Summarise all company documents.")
    default_title = REPORT_TITLES.get(request.report_type.value, "Business Report")
    final_title = request.title.strip() if request.title.strip() else default_title

    debug_log("REPORTS", f"Generating '{final_title}' for company {request.company_id}")

    # Step 1: Retrieve relevant chunks
    chunks = await _get_chunks(
        company_id=request.company_id,
        topic=topic,
        chat_id=request.chat_id,
        top_k=request.top_k,
    )

    if not chunks:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No AI-ready documents found for company '{request.company_id}'. "
                "Upload and process documents before generating reports."
            ),
        )

    # Step 2: Generate report content via Gemini
    content = await _generate_report_content(topic=topic, chunks=chunks)

    # Step 3: Save to reports table
    report_id = str(uuid.uuid4())
    sb = get_supabase_client()

    try:
        sb.table("reports").insert({
            "id": report_id,
            "company_id": request.company_id,
            "report_type": request.report_type.value,
            "title": final_title,
            "content": content.model_dump(),
            "generated_by": current_user.id,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }).execute()
        debug_log("REPORTS", f"Saved report {report_id}")
    except Exception as e:
        print(f"[WARN] Could not save report to DB: {e}")

    return ReportGenerateResponse(
        report_id=report_id,
        company_id=request.company_id,
        report_type=request.report_type.value,
        title=final_title,
        content=content,
        generated_by=current_user.id,
        chunks_used=len(chunks),
        message=(
            f"'{final_title}' generated successfully "
            f"from {len(chunks)} document segments."
        ),
    )


# ---------------------------------------------------------------------------
# GET /reports
# ---------------------------------------------------------------------------

@router.get(
    "",
    response_model=ReportListResponse,
    summary="List all saved reports for a company",
    description=(
        "Returns all previously generated reports for a company, newest first.\n\n"
        "Each report includes the full structured content: summary, key findings, "
        "risks, recommendations, missing data, and sources."
    ),
)
async def list_reports(
    company_id: str = Query(..., description="UUID of the company"),
    report_type: str | None = Query(
        default=None,
        description="Filter by report type: management_summary, hr_compliance, etc."
    ),
    limit: int = Query(default=20, ge=1, le=100, description="Max reports to return"),
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    Retrieve all saved reports for a company.
    Optionally filter by report_type. Ordered newest first.
    """
    sb = get_supabase_client()

    query = (
        sb.table("reports")
        .select("*")
        .eq("company_id", company_id)
        .order("created_at", desc=True)
        .limit(limit)
    )

    if report_type:
        query = query.eq("report_type", report_type)

    try:
        result = query.execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    records = []
    for r in result.data or []:
        raw_content = r.get("content", {})
        if isinstance(raw_content, str):
            try:
                raw_content = json.loads(raw_content)
            except Exception:
                raw_content = {}

        try:
            content = ReportContent(**raw_content)
        except Exception:
            content = ReportContent(
                summary="Content unavailable.",
                key_findings=[],
                risks=[],
                recommendations=[],
                missing_data=[],
                sources=[],
            )

        records.append(
            ReportRecord(
                id=r["id"],
                company_id=r["company_id"],
                report_type=r.get("report_type", ""),
                title=r.get("title", ""),
                content=content,
                generated_by=r.get("generated_by", ""),
                created_at=str(r.get("created_at", "")),
            )
        )

    return ReportListResponse(
        company_id=company_id,
        reports=records,
        total=len(records),
    )