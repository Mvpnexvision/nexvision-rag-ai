"""
app/reports/schemas.py
=======================
Request and response schemas for the Reports Module.

Aligned to `reports` table spec:
    company_id, report_type, title, content, generated_by, created_at
"""

from pydantic import BaseModel, Field
from typing import Literal
from enum import Enum


class ReportType(str, Enum):
    """
    Supported report types.
    Each type triggers a different AI analysis and summary style.
    """
    management_summary = "management_summary"
    hr_compliance = "hr_compliance"
    sales_performance = "sales_performance"
    logistics = "logistics"
    pms = "pms"
    risk = "risk"


class ReportGenerateRequest(BaseModel):
    """
    Request body for POST /reports/generate.
    Tells the AI what kind of report to generate and for which company.
    """

    company_id: str = Field(
        ...,
        description="UUID of the company to generate the report for.",
    )
    user_id: str = Field(
        ...,
        description="UUID of the user requesting the report.",
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
        description="Optional custom title for the report. Auto-generated if left empty.",
    )
    top_k: int = Field(
        default=10,
        ge=1,
        le=20,
        description="Number of document chunks to retrieve for report generation.",
    )


class ReportContent(BaseModel):
    """
    The structured content of a generated report.
    """

    summary: str = Field(
        ...,
        description="Executive summary of the report findings.",
    )
    key_findings: list[str] = Field(
        ...,
        description="List of key findings from the company documents.",
    )
    risks: list[str] = Field(
        default_factory=list,
        description="Identified risks from the documents.",
    )
    recommendations: list[str] = Field(
        ...,
        description="List of recommended actions based on findings.",
    )
    sources: list[str] = Field(
        ...,
        description="Source documents used to generate this report.",
    )


class ReportRecord(BaseModel):
    """
    A single saved report record from the `reports` table.
    """

    id: str
    company_id: str
    report_type: str
    title: str
    content: ReportContent
    generated_by: str
    created_at: str


class ReportGenerateResponse(BaseModel):
    """
    Response from POST /reports/generate.
    """

    report_id: str = Field(..., description="UUID of the saved report record.")
    company_id: str
    report_type: str
    title: str
    content: ReportContent
    generated_by: str
    message: str


class ReportListResponse(BaseModel):
    """
    Response from GET /reports.
    Returns all saved reports for a company.
    """

    company_id: str
    reports: list[ReportRecord]
    total: int