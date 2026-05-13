"""
modules/document_module/services/extractor.py
=============================================
STAGE 1 of the document pipeline: Extract

Responsibility: Accept raw file bytes and a filename, return plain text.

Supported formats (per product spec):
    ┌────────┬──────────────────────────────────────────────────────┐
    │ Format │ Library & Notes                                      │
    ├────────┼──────────────────────────────────────────────────────┤
    │ PDF    │ pypdf — embeds [PAGE N] markers for citation         │
    │ DOCX   │ python-docx — extracts paragraphs and table cells    │
    │ XLSX   │ openpyxl — converts each sheet to tab-delimited text │
    │ CSV    │ pandas — reads and converts to plain text rows       │
    │ TXT    │ direct UTF-8 / latin-1 decode                        │
    └────────┴──────────────────────────────────────────────────────┘

Why isolate extraction?
    All other pipeline stages (chunker, embedder, vector_store) receive
    plain text. If a new format is added, only this file changes.

Important: this function receives raw bytes, NOT an UploadFile.
    The router reads the file once for storage upload, then passes
    the bytes here. This avoids reading the stream twice.
"""

import io
import csv
from pypdf import PdfReader
from docx import Document as DocxDocument
import openpyxl
import pandas as pd
from fastapi import HTTPException


# Allowed extensions mapped to their MIME types
SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".xlsx", ".csv", ".txt"}


def extract_text_from_bytes(raw_bytes: bytes, filename: str) -> str:
    """
    Extract plain text from raw file bytes based on the file extension.

    This is the single entry point for text extraction. The router passes
    the raw bytes after the file has been saved to storage — no disk I/O here.

    Args:
        raw_bytes (bytes): Complete file content in memory.
        filename (str):    Original filename, used to determine format
                           and for error messages.

    Returns:
        str: Full plain-text content of the document. For multi-page or
             multi-sheet documents, page/sheet markers are embedded so
             the chunker can attach accurate source references.

    Raises:
        HTTPException 415: Unsupported file format.
        HTTPException 400: File is empty or extraction produced no content.
    """
    if not raw_bytes:
        raise HTTPException(status_code=400, detail=f"File '{filename}' is empty.")

    ext = _get_extension(filename)

    if ext == ".pdf":
        return _extract_pdf(raw_bytes, filename)
    elif ext == ".docx":
        return _extract_docx(raw_bytes, filename)
    elif ext == ".xlsx":
        return _extract_xlsx(raw_bytes, filename)
    elif ext == ".csv":
        return _extract_csv(raw_bytes, filename)
    elif ext == ".txt":
        return _extract_txt(raw_bytes, filename)
    else:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported file type '{ext}' in '{filename}'. "
                f"Supported formats: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
            ),
        )


def get_file_type(filename: str) -> str:
    """
    Return the normalised file type string for a given filename.

    This matches the `file_type` column in the `documents` table.

    Args:
        filename: Original filename.

    Returns:
        str: Uppercase extension without the dot, e.g. "PDF", "DOCX", "CSV".

    Raises:
        HTTPException 415: If the extension is not supported.
    """
    ext = _get_extension(filename)
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported file type '{ext}'. "
                f"Supported: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
            ),
        )
    return ext.lstrip(".").upper()


# ---------------------------------------------------------------------------
# Private extraction helpers — one per format
# ---------------------------------------------------------------------------


def _get_extension(filename: str) -> str:
    """Return lowercase file extension including the dot, e.g. '.pdf'."""
    dot_index = filename.rfind(".")
    if dot_index == -1:
        return ""
    return filename[dot_index:].lower()


def _extract_pdf(raw_bytes: bytes, filename: str) -> str:
    """
    Extract text from a PDF using pypdf.

    Each page's text is prefixed with a [PAGE N] marker so the chunker
    can record which page each chunk originated from — this becomes the
    citation page reference in AI responses.

    Limitation: scanned/image-only PDFs will yield no text. OCR support
    (e.g. pytesseract) can be added here in a future iteration.
    """
    try:
        reader = PdfReader(io.BytesIO(raw_bytes))
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not parse PDF '{filename}': {exc}"
        )

    pages: list[str] = []
    for i, page in enumerate(reader.pages, start=1):
        page_text = page.extract_text() or ""
        if page_text.strip():
            pages.append(f"[PAGE {i}]\n{page_text.strip()}")

    if not pages:
        raise HTTPException(
            status_code=400,
            detail=(
                f"No text could be extracted from '{filename}'. "
                "The PDF may be image-only (scanned). OCR is not yet supported."
            ),
        )

    return "\n\n".join(pages)


def _extract_docx(raw_bytes: bytes, filename: str) -> str:
    """
    Extract text from a DOCX file using python-docx.

    Extracts in reading order:
      - Paragraphs (body text, headings, lists)
      - Table cells (row by row, cell by cell, tab-separated)

    Tables are marked with [TABLE] so the chunker can treat them as
    a distinct content block — useful for financial tables in reports.
    """
    try:
        doc = DocxDocument(io.BytesIO(raw_bytes))
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not parse DOCX '{filename}': {exc}"
        )

    parts: list[str] = []

    # Iterate body elements in order (paragraphs and tables are interleaved)
    for element in doc.element.body:
        tag = element.tag.split("}")[-1]  # strip XML namespace

        if tag == "p":
            # Paragraph — extract text directly
            para_text = element.text_content().strip() if hasattr(element, 'text_content') else ""
            # Fallback: use python-docx paragraph object
            pass

        if tag == "tbl":
            # Table — will be handled via doc.tables below
            pass

    # Simpler approach: iterate paragraphs and tables separately
    # python-docx exposes them as parallel collections
    for para in doc.paragraphs:
        text = para.text.strip()
        if text:
            parts.append(text)

    for table in doc.tables:
        table_rows = []
        for row in table.rows:
            cell_texts = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if cell_texts:
                table_rows.append("\t".join(cell_texts))
        if table_rows:
            parts.append("[TABLE]\n" + "\n".join(table_rows))

    if not parts:
        raise HTTPException(
            status_code=400,
            detail=f"No text content found in '{filename}'. The DOCX may be empty."
        )

    return "\n\n".join(parts)


def _extract_xlsx(raw_bytes: bytes, filename: str) -> str:
    """
    Extract text from an XLSX file using openpyxl.

    Processes every sheet. Each sheet is prefixed with a [SHEET: name] marker
    so the chunker can include the sheet name in chunk metadata.

    Empty cells are skipped. Rows are tab-separated, sheets are newline-separated.
    Numeric values are preserved as strings (e.g. "1234.56") for embedding.
    """
    try:
        wb = openpyxl.load_workbook(io.BytesIO(raw_bytes), read_only=True, data_only=True)
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not parse XLSX '{filename}': {exc}"
        )

    sheets_text: list[str] = []

    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        rows_text: list[str] = []

        for row in ws.iter_rows(values_only=True):
            # Convert all cell values to strings, skip None
            cell_values = [str(cell) for cell in row if cell is not None]
            if cell_values:
                rows_text.append("\t".join(cell_values))

        if rows_text:
            sheet_block = f"[SHEET: {sheet_name}]\n" + "\n".join(rows_text)
            sheets_text.append(sheet_block)

    wb.close()

    if not sheets_text:
        raise HTTPException(
            status_code=400,
            detail=f"No data found in '{filename}'. The XLSX may be empty."
        )

    return "\n\n".join(sheets_text)


def _extract_csv(raw_bytes: bytes, filename: str) -> str:
    """
    Extract text from a CSV file using pandas.

    Reads the CSV into a DataFrame, then converts each row to a
    human-readable "Field: Value" format rather than raw comma-separated
    values. This gives the embedding model more context per chunk
    (knowing the column header = knowing what the number means).

    Example output:
        [ROW 1]
        Revenue: 4200000
        Department: Finance
        Quarter: Q3 2024
    """
    try:
        df = pd.read_csv(io.BytesIO(raw_bytes))
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not parse CSV '{filename}': {exc}"
        )

    if df.empty:
        raise HTTPException(
            status_code=400,
            detail=f"CSV file '{filename}' is empty or has no data rows."
        )

    rows_text: list[str] = []
    for i, (_, row) in enumerate(df.iterrows(), start=1):
        # Convert each row to "Column: Value" pairs
        fields = [
            f"{col}: {val}"
            for col, val in row.items()
            if pd.notna(val) and str(val).strip()
        ]
        if fields:
            rows_text.append(f"[ROW {i}]\n" + "\n".join(fields))

    if not rows_text:
        raise HTTPException(
            status_code=400,
            detail=f"No readable data rows found in '{filename}'."
        )

    return "\n\n".join(rows_text)


def _extract_txt(raw_bytes: bytes, filename: str) -> str:
    """
    Decode a plain text file.

    Tries UTF-8 first (the standard for most modern text files),
    falls back to latin-1 which can decode any byte sequence without error.
    """
    try:
        return raw_bytes.decode("utf-8").strip()
    except UnicodeDecodeError:
        try:
            return raw_bytes.decode("latin-1").strip()
        except Exception as exc:
            raise HTTPException(
                status_code=400,
                detail=f"Could not decode text file '{filename}': {exc}"
            )