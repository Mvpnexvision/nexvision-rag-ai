"""
app/insight/services/generator.py
===================================
Prompt construction and Gemini call for the insight pipeline (v4).

Responsibilities:
  - Build the full prompt from system rules + .md business context + RAG chunks + question
  - Call Gemini via the shared client
  - Parse and validate the response into AIOutputJSON

This file is called exclusively by pipeline.py.
The separation keeps prompt logic isolated from orchestration logic.
"""

import json
import re
from fastapi import HTTPException
from core.config import settings
from core.gemini_client import get_chat_model
from app.insight.schemas import AIOutputJSON


# ── System Prompt ──────────────────────────────────────────────────────────────

NEXVISION_SYSTEM_PROMPT = """
You are NexVision Reasoning AI.
You help businesses understand their own documents and company data.

STRICT RULES:
1. Use ONLY the provided document context and business context below. Do not use outside knowledge.
2. Do not invent facts. If you are unsure, say so explicitly in direct_answer.
3. If required data is missing, list the missing items in missing_data[].
4. Always explain your reasoning step by step in the reasoning field.
5. Always give a practical, specific business recommendation — or leave recommendation as an empty string if data is insufficient.
6. Always assess risk: Low, Medium, High, or Critical.
7. business_impact and next_action should be empty strings (not omitted) when data is insufficient.
8. Always cite the source document and page number for every factual claim in sources[].
9. Write in clear, professional business English.
10. Be direct, practical, and decision-focused.

OUTPUT FORMAT:
Respond with ONLY valid JSON — no markdown fences, no preamble, no explanation outside the JSON.
The JSON must exactly match this schema:

{
  "direct_answer": "Concise 1-2 sentence answer to the question.",
  "evidence_found": [
    "Specific fact 1 found in the documents (with inline source reference)",
    "Specific fact 2 found in the documents"
  ],
  "reasoning": "Step-by-step explanation of how you reached your conclusion.",
  "recommendation": "Specific, actionable business recommendation. Empty string if data is insufficient.",
  "risk_level": "Low | Medium | High | Critical",
  "business_impact": "What happens to the business if no action is taken. Empty string if insufficient.",
  "next_action": "The single most important action, with owner and timeline. Empty string if insufficient.",
  "missing_data": [
    "Name of document or data that would improve this analysis but was not found in context"
  ],
  "sources": [
    "Filename.pdf, page 4",
    "Spreadsheet.xlsx, Sheet: Revenue, page N/A"
  ]
}
""".strip()


# ── Context Block Builders ─────────────────────────────────────────────────────


def _build_chunk_context(chunks: list[dict]) -> str:
    """
    Format retrieved RAG chunks into a labelled [DOCUMENT CONTEXT] block.

    Each chunk is prefixed with a [SOURCE] line to allow the AI to cite
    the correct file and page number in its response.

    Args:
        chunks: Raw chunk dicts from vector_search(). Each must have:
                chunk_text, metadata_json (str or dict), page_number.

    Returns:
        str: Formatted multi-chunk context string, or empty string if no chunks.
    """
    if not chunks:
        return ""

    parts: list[str] = []

    for chunk in chunks:
        # Parse metadata_json — stored as a JSON string or dict in the DB
        raw_meta = chunk.get("metadata_json")
        if isinstance(raw_meta, str):
            try:
                meta = json.loads(raw_meta)
            except (json.JSONDecodeError, TypeError):
                meta = {}
        elif isinstance(raw_meta, dict):
            meta = raw_meta
        else:
            meta = {}

        source_file = meta.get("source_file", "unknown")
        page = chunk.get("page_number") or meta.get("page_number")
        page_ref = f"Page {page}" if page else "Page N/A"

        # Include extra metadata (sheet name, row, etc.) if present
        extra_parts: list[str] = []
        if meta.get("sheet_name"):
            extra_parts.append(f"Sheet: {meta['sheet_name']}")
        if meta.get("row"):
            extra_parts.append(f"Row: {meta['row']}")

        source_line = f"[SOURCE: {source_file}, {page_ref}"
        if extra_parts:
            source_line += f", {', '.join(extra_parts)}"
        source_line += "]"

        chunk_text = chunk.get("chunk_text", "")
        parts.append(f"{source_line}\n{chunk_text}")

    return "\n\n".join(parts)


def _parse_gemini_json(raw_text: str) -> dict:
    """
    Extract and parse JSON from Gemini's raw response text.

    Strips markdown code fences (```json ... ```) that Gemini sometimes
    adds despite being instructed not to, then parses the cleaned string.

    Args:
        raw_text: The .text property from a Gemini generate_content response.

    Returns:
        dict: Parsed JSON as a Python dict.

    Raises:
        HTTPException 500: If the response cannot be parsed as JSON.
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


# ── Main Generator Function ────────────────────────────────────────────────────


async def build_and_call_gemini(
    question: str,
    chunks: list[dict],
    md_context: str = "",
) -> AIOutputJSON:
    """
    Build the full prompt, call Gemini, and return a validated AIOutputJSON.

    Prompt structure (in order):
        [SYSTEM RULES]
        [BUSINESS CONTEXT — from .md file if present]
        [DOCUMENT CONTEXT — from RAG chunks]
        [USER QUESTION]

    Args:
        question:   The user's natural language question.
        chunks:     Raw chunk dicts from vector_search(). May be empty.
        md_context: Plain-text content from .md context files. May be empty.

    Returns:
        AIOutputJSON: Validated structured AI output.

    Raises:
        HTTPException 500: If Gemini returns an empty or unparseable response.
        HTTPException 500: If the response does not match the AIOutputJSON schema.
    """
    # Build the [BUSINESS CONTEXT] section
    business_context_block = ""
    if md_context and md_context.strip():
        business_context_block = (
            "[BUSINESS CONTEXT — read this first, it describes the company's operations]\n"
            f"{md_context}\n"
        )

    # Build the [DOCUMENT CONTEXT] section from RAG chunks
    chunk_context_block = _build_chunk_context(chunks)
    if chunk_context_block:
        document_context_section = (
            "[DOCUMENT CONTEXT — use ONLY these documents to answer the question]\n"
            f"{chunk_context_block}"
        )
    else:
        document_context_section = (
            "[DOCUMENT CONTEXT]\n"
            "No relevant document chunks were found. "
            "State this clearly in direct_answer and populate missing_data accordingly."
        )

    # Assemble the full prompt
    full_prompt = (
        f"{NEXVISION_SYSTEM_PROMPT}\n\n"
        f"{business_context_block}\n"
        f"{document_context_section}\n\n"
        f"[USER QUESTION]\n"
        f"{question}\n\n"
        "Respond with ONLY valid JSON matching the schema above. No markdown fences."
    )

    # Call Gemini
    model = get_chat_model()
    response = model.generate_content(
        model=settings.GEMINI_CHAT_MODEL,
        contents=full_prompt,
    )

    if not response.text:
        raise HTTPException(
            status_code=500,
            detail="Gemini returned an empty response. Please try again.",
        )

    # Parse JSON response
    parsed = _parse_gemini_json(response.text)

    # Validate with Pydantic — raises ValidationError if schema doesn't match
    try:
        return AIOutputJSON(**parsed)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"AI response did not match expected output schema: {exc}",
        )