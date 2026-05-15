"""
app/reports/schemas.py
=======================
Request and response schemas for the Reports Module (v4).

Aligned with the v4 insight module architecture:
    - Uses AIOutputJSON as the base AI output shape
    - Company-scoped via current_user from JWT
    - Saved to `reports` table: company_id, report_type, title, content, generated_by, created_at

Report types mirror the business lines from the spec:
    management_summary, hr_compliance, sales_performance,
    logistics, pms, risk
"""

from pydantic import BaseModel, Field
from typing import Literal
from enum import Enum


class ReportType(str, Enum):
    """
    Supported report types.
    Each type triggers a different AI analysis prompt and summary style.
    """
    management_summary = "management_summary"
    hr_compliance = "hr_compliance"
    sales_performance = "sales_performance"
    logistics = "logistics"
    pms = "pms"
    risk = "risk"


# ---------------------------------------------------------------------------
# Report content — the structured AI output for reports
# ---------------------------------------------------------------------------

class ReportContent(BaseModel):
    """
    Structured content of a generated report.

    Aligned with AIOutputJSON fields from the v4 insight module,
    but shaped for a report format rather than a chat answer.
    """

    summary: str = Field(
        ...,
        description="Executive summary of the report findings in 2-3 sentences.",
    )
    key_findings: list[str] = Field(
        ...,
        description="List of key findings from the company documents, each with source citation.",
    )
    risks: list[str] = Field(
        default_factory=list,
        description="Identified risks from the documents with risk level noted.",
    )
    recommendations: list[str] = Field(
        ...,
        description="List of recommended actions with owner and timeline.",
    )
    missing_data: list[str] = Field(
        default_factory=list,
        description="Data that would improve this report but was not found in documents.",
    )
    sources: list[str] = Field(
        ...,
        description="Source citations: 'filename.ext, page N' for every finding.",
    )


# ---------------------------------------------------------------------------
# Request
# ---------------------------------------------------------------------------

class ReportGenerateRequest(BaseModel):
    """
    Request body for POST /reports/generate.
    Tells the AI what kind of report to generate and for which company.
    """

    company_id: str = Field(
        ...,
        description="UUID of the company to generate the report for.",
    )
    report_type: ReportType = Field(
        ...,
        description=(
            "Type of report to generate:\n"
            "- management_summary: Overall business health summary\n"
            "- hr_compliance: HR policy and compliance issues\n"
            "- sales_performance: Sales trends and performance\n"
            "- logistics: Delivery and fleet status\n"
            "- pms: Equipment maintenance schedule\n"
            "- risk: All high and critical risk findings"
        ),
        examples=["management_summary"],
    )
    title: str = Field(
        default="",
        description="Optional custom title. Auto-generated from report_type if left empty.",
    )
    chat_id: str | None = Field(
        default=None,
        description=(
            "Optional: scope the report to documents attached to a specific chat session. "
            "If not provided, uses all AI-ready documents for the company."
        ),
    )
    top_k: int = Field(
        default=10,
        ge=1,
        le=20,
        description="Number of document chunks to retrieve for report generation.",
    )


# ---------------------------------------------------------------------------
# Responses
# ---------------------------------------------------------------------------

class ReportGenerateResponse(BaseModel):
    """Response from POST /reports/generate."""

    report_id: str = Field(..., description="UUID of the saved report record.")
    company_id: str
    report_type: str
    title: str
    content: ReportContent
    generated_by: str = Field(..., description="UUID of the user who generated the report.")
    chunks_used: int
    message: str


class ReportRecord(BaseModel):
    """
    A single saved report record from the `reports` table.
    Returned by GET /reports.
    """

    id: str
    company_id: str
    report_type: str
    title: str
    content: ReportContent
    generated_by: str
    created_at: str


class ReportListResponse(BaseModel):
    """Response from GET /reports."""

    company_id: str
    reports: list[ReportRecord]
    total: int