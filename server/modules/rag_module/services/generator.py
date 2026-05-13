"""
modules/rag_module/services/generator.py
=========================================
STAGE 6 of the pipeline: Generate

Responsibility: Build a structured prompt from retrieved chunks and the
user's question, call Gemini, and parse the response into NexVisionInsight.

Changes from v1:
    - Context builder uses `chunk.chunk_text` (not `chunk.text`)
    - Includes `chunk.metadata` for richer source citations
      (e.g. [SOURCE: Sales.xlsx, Sheet: Q3, Page N/A])
    - Insight prompt mode param added — "chat" for direct Q&A,
      "insight" for proactive risk/opportunity analysis
"""

import json
import re
from fastapi import HTTPException
from core.gemini_client import get_chat_model
from modules.rag_module.schemas import NexVisionInsight, RetrievedChunk


# ---------------------------------------------------------------------------
# NexVision system prompt — embedded in every AI call
# ---------------------------------------------------------------------------

NEXVISION_SYSTEM_PROMPT = """
You are NexVision Reasoning AI.
You help businesses understand their own documents and company data.

STRICT RULES:
1. Use ONLY the provided document context below. Do not use outside knowledge.
2. Do not invent facts. If you are unsure, say so explicitly.
3. If required data is missing from the context, list it in missing_data.
4. Always explain your reasoning step by step.
5. Always give a practical, specific business recommendation.
6. Always assess and include a risk level: Low, Medium, High, or Critical.
7. Always include a concrete next_action (who should do what, by when).
8. Always cite the source document and page number for every factual claim.
9. Write in clear, professional business English.
10. Be direct, practical, and decision-focused.

OUTPUT FORMAT:
Respond with ONLY valid JSON — no markdown fences, no preamble, no explanation.
The JSON must exactly match this schema:

{
  "direct_answer": "Concise 1-2 sentence answer to the question.",
  "evidence_found": [
    "Specific fact 1 found in the documents (cite source inline)",
    "Specific fact 2 found in the documents"
  ],
  "reasoning": "Step-by-step explanation of how you reached your conclusion.",
  "recommendation": "Specific, actionable business recommendation.",
  "risk_level": "Low | Medium | High | Critical",
  "business_impact": "What happens to the business if no action is taken.",
  "next_action": "The single most important action, with owner and timeline.",
  "missing_data": [
    "Data that would improve this analysis but was not found in context"
  ],
  "sources": [
    "Filename.pdf, page 4",
    "Spreadsheet.xlsx, Sheet: Revenue, page N/A"
  ]
}
""".strip()

INSIGHT_MODE_ADDENDUM = """

ADDITIONAL INSTRUCTION (Insight Generation Mode):
You are generating a PROACTIVE BUSINESS INSIGHT — not just answering a question.
Analyse the retrieved context to surface:
  - Hidden risks the business may not have noticed
  - Patterns that suggest a systemic problem
  - Opportunities that the data reveals
  - Comparisons across time periods or categories if available
Be comprehensive. The goal is to add business intelligence value beyond what
a human would notice from a quick read of the documents.
""".strip()


def _build_context_block(chunks: list[RetrievedChunk]) -> str:
    """
    Format retrieved chunks into a labelled context block for the AI prompt.

    Each chunk is prefixed with a [SOURCE] line containing the filename,
    page/row number, and any extra metadata (e.g. sheet name for XLSX).
    This allows the AI to construct accurate source citations.

    Args:
        chunks: Retrieved and ranked document chunks.

    Returns:
        str: Formatted multi-chunk context string.

    Example output:
        [SOURCE: Q3_Report.pdf, Page 4]
        Accounts payable overdue by 45 days. Disputed vendor invoice ₱1.2M...

        [SOURCE: Vendor_Ledger.xlsx, Sheet: Q3 Payables, Page N/A]
        Vendor ABC: 60 days overdue | ₱450,000 | Status: Disputed...
    """
    parts: list[str] = []

    for chunk in chunks:
        # Build source reference line
        page_ref = f"Page {chunk.page_number}" if chunk.page_number else "Page N/A"

        # Include extra metadata (sheet name, row, etc.) if present
        extra_parts = []
        if chunk.metadata.get("sheet_name"):
            extra_parts.append(f"Sheet: {chunk.metadata['sheet_name']}")
        if chunk.metadata.get("row"):
            extra_parts.append(f"Row: {chunk.metadata['row']}")

        extra_str = ", ".join(extra_parts)
        source_line = f"[SOURCE: {chunk.source_file}, {page_ref}"
        if extra_str:
            source_line += f", {extra_str}"
        source_line += "]"

        parts.append(f"{source_line}\n{chunk.chunk_text}")

    return "\n\n".join(parts)


def _parse_gemini_json(raw_text: str) -> dict:
    """
    Extract and parse JSON from Gemini's response.

    Strips markdown code fences (```json ... ```) that Gemini sometimes
    adds despite being told not to, then parses the cleaned string.

    Args:
        raw_text: Raw text from Gemini's .text property.

    Returns:
        dict: Parsed JSON as a Python dict.

    Raises:
        HTTPException 500: If the response cannot be parsed.
    """
    # Strip markdown fences
    cleaned = re.sub(r"```(?:json)?\s*", "", raw_text).strip()
    cleaned = re.sub(r"```\s*$", "", cleaned).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                f"AI returned malformed JSON. Parse error: {exc}. "
                f"First 500 chars of response: {raw_text[:500]}"
            ),
        )


async def generate_insight(
    question: str,
    chunks: list[RetrievedChunk],
    mode: str = "chat",
) -> NexVisionInsight:
    """
    Generate a structured NexVision business insight from document chunks.

    Builds a full prompt (system rules + context + question), sends it to
    Gemini, and parses the structured JSON response into a NexVisionInsight.

    Args:
        question (str):             The user's question or analysis topic.
        chunks (list[RetrievedChunk]): Retrieved chunks from the vector DB.
        mode (str):                 "chat" for direct Q&A (default),
                                    "insight" for proactive analysis mode.

    Returns:
        NexVisionInsight: Validated structured insight with all required fields.

    Raises:
        HTTPException 400: No chunks provided.
        HTTPException 500: Gemini returns empty or unparseable response.
    """
    if not chunks:
        raise HTTPException(
            status_code=400,
            detail=(
                "No relevant document chunks found. "
                "Ensure documents have been uploaded and processed (status: AI Ready)."
            ),
        )

    # Build the context block from retrieved chunks
    context_block = _build_context_block(chunks)

    # Add mode-specific instruction
    mode_addendum = INSIGHT_MODE_ADDENDUM if mode == "insight" else ""

    # Assemble the full prompt
    full_prompt = (
        f"{NEXVISION_SYSTEM_PROMPT}"
        f"{mode_addendum}\n\n"
        f"DOCUMENT CONTEXT (use ONLY this — do not invent facts):\n"
        f"{context_block}\n\n"
        f"USER QUESTION: {question}\n\n"
        f"Respond with ONLY valid JSON matching the schema above. No markdown."
    )

    # Call Gemini
    model = get_chat_model()
    response = model.generate_content(full_prompt)

    if not response.text:
        raise HTTPException(
            status_code=500,
            detail="Gemini returned an empty response. Please try again."
        )

    # Parse JSON
    parsed = _parse_gemini_json(response.text)

    # Validate with Pydantic — raises ValidationError if schema doesn't match
    try:
        return NexVisionInsight(**parsed)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"AI response did not match expected insight schema: {exc}",
        )