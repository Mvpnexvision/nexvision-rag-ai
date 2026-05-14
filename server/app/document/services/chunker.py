"""
app/document/services/chunker.py
===========================================
STAGE 2 of the document pipeline: Chunk

Responsibility: Split extracted plain text into overlapping word-window
segments (chunks) with metadata for source citation.

Changes from v1:
    - Detects [SHEET: name] markers (from XLSX extractor) in addition to [PAGE N]
    - Detects [ROW N] markers (from CSV extractor)
    - Passes `extra_metadata` dict through to the vector store so sheet/row
      information can be stored in `metadata_json`
    - Column name aligned: 'text' key retained (embedder uses it); vector_store
      maps it to `chunk_text` when inserting

Format-specific markers inserted by the extractor:
    PDF  → [PAGE N]      → page_number populated, extra_metadata empty
    DOCX → no markers    → page_number None (DOCX has no reliable page breaks)
    XLSX → [SHEET: name] → extra_metadata = {"sheet_name": name}
    CSV  → [ROW N]       → page_number maps to row number, extra_metadata = {"row": N}
    TXT  → no markers    → page_number None
"""

import re
import uuid
from core.config import settings


def chunk_text(
    text: str,
    document_id: str,
    company_id: str,
    source_file: str,
    chunk_size: int = settings.CHUNK_SIZE,
    overlap: int = settings.CHUNK_OVERLAP,
) -> list[dict]:
    """
    Split extracted document text into overlapping word-window chunks.

    Algorithm:
        1. Walk lines to detect format markers ([PAGE N], [SHEET: X], [ROW N]).
        2. Build a flat word list with per-word metadata (page/sheet/row).
        3. Slide a window of `chunk_size` words, stepping by (chunk_size - overlap).
        4. Each chunk carries the metadata of its first word as its citation source.

    Args:
        text (str):          Full plain text from the extractor.
        document_id (str):   Parent document UUID.
        company_id (str):    Owning company identifier.
        source_file (str):   Original filename (e.g. "Sales_Report.xlsx").
        chunk_size (int):    Target words per chunk (default from settings).
        overlap (int):       Words shared between adjacent chunks.

    Returns:
        list[dict]: Chunk dicts ready for the embedder. Each contains:
            chunk_id       str
            document_id    str
            company_id     str
            text           str         chunk's word content
            source_file    str
            page_number    int | None  (PDF page or CSV row number)
            chunk_index    int         0-based position
            extra_metadata dict        format-specific info (e.g. sheet_name)
    """
    if not text or not text.strip():
        return []

    # ---------------------------------------------------------------
    # Walk lines — extract words and per-word context markers
    # ---------------------------------------------------------------

    words: list[str] = []
    page_map: list[int | None] = []           # page number per word
    sheet_map: list[str | None] = []          # sheet name per word
    row_map: list[int | None] = []            # CSV row number per word

    current_page: int | None = None
    current_sheet: str | None = None
    current_row: int | None = None

    for line in text.splitlines():
        stripped = line.strip()

        # PDF page marker
        page_match = re.match(r"^\[PAGE (\d+)\]$", stripped)
        if page_match:
            current_page = int(page_match.group(1))
            current_row = None
            continue

        # XLSX sheet marker
        sheet_match = re.match(r"^\[SHEET: (.+)\]$", stripped)
        if sheet_match:
            current_sheet = sheet_match.group(1).strip()
            current_page = None
            current_row = None
            continue

        # CSV / XLSX row marker
        row_match = re.match(r"^\[ROW (\d+)\]$", stripped)
        if row_match:
            current_row = int(row_match.group(1))
            current_page = None
            continue

        # DOCX table marker — keep content, just note the block type
        if stripped == "[TABLE]":
            continue  # Don't add the marker itself as a word

        # Normal content line
        line_words = stripped.split()
        for w in line_words:
            words.append(w)
            page_map.append(current_page)
            sheet_map.append(current_sheet)
            row_map.append(current_row)

    if not words:
        return []

    # ---------------------------------------------------------------
    # Sliding window chunking
    # ---------------------------------------------------------------

    step = max(1, chunk_size - overlap)
    chunks: list[dict] = []
    chunk_index = 0
    start = 0

    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk_words = words[start:end]
        chunk_text_str = " ".join(chunk_words)

        # Metadata from the first word of this chunk
        page = page_map[start]
        sheet = sheet_map[start]
        row = row_map[start]

        # If it's a CSV row marker, use row as page_number for citation
        citation_page = page if page is not None else row

        # Build extra_metadata for XLSX sheets or other format-specific info
        extra: dict = {}
        if sheet:
            extra["sheet_name"] = sheet
        if row is not None and page is None:
            extra["row"] = row

        chunks.append(
            {
                "chunk_id": str(uuid.uuid4()),
                "document_id": document_id,
                "company_id": company_id,
                "text": chunk_text_str,
                "source_file": source_file,
                "page_number": citation_page,
                "chunk_index": chunk_index,
                "extra_metadata": extra,
            }
        )

        chunk_index += 1
        if end == len(words):
            break
        start += step

    return chunks