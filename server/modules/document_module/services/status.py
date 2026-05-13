"""
modules/document_module/services/status.py
==========================================
Document Processing Status Service

Responsibility: Update the `processing_status` column in the `documents`
table as the document moves through the ingestion pipeline.

Why track status in the database?
    Processing a document can take several seconds (or longer for large files).
    The frontend needs to poll or subscribe to know when it's safe to query
    the document. Status also tells the user exactly where a failure occurred
    so they can take the right action (reprocess vs. upload a cleaner file).

The six processing statuses (from product spec):
    ┌─────────────┬────────────────────────────────────────────────────┐
    │ Status      │ Meaning                                            │
    ├─────────────┼────────────────────────────────────────────────────┤
    │ Uploaded    │ File received and saved to Supabase Storage        │
    │ Extracting  │ Reading text/data from the file                    │
    │ Chunking    │ Splitting content into searchable segments         │
    │ Embedded    │ Embeddings created for all chunks                  │
    │ AI Ready    │ Document is available for AI Chat and AI Insights  │
    │ Failed      │ An error occurred — user can reprocess or replace  │
    └─────────────┴────────────────────────────────────────────────────┘

Usage pattern:
    Every stage of the processing pipeline calls set_status() before it
    starts doing its work. If an exception is raised mid-pipeline, the
    calling code catches it and calls set_status(document_id, "Failed").
"""

from typing import Literal
from core.supabase_client import get_supabase_client

# Type alias for the status values — provides IDE autocomplete and type safety
ProcessingStatus = Literal[
    "Uploaded",
    "Extracting",
    "Chunking",
    "Embedded",
    "AI Ready",
    "Failed",
]


async def set_status(
    document_id: str,
    status: ProcessingStatus,
    error_message: str | None = None,
) -> None:
    """
    Update the `processing_status` of a document in the database.

    This is a fire-and-update operation called at the start of each pipeline
    stage. The frontend can poll `GET /documents` to read the current status
    and display a progress indicator.

    Args:
        document_id (str):         UUID of the document to update.
        status (ProcessingStatus): The new status value (must be one of the
                                   six defined statuses above).
        error_message (str|None):  If status is "Failed", optionally store
                                   the error message in metadata for debugging.
                                   Stored in the document's `tags` field as a
                                   simple JSON note (until an `error_log` column
                                   is added in a future migration).

    Example:
        await set_status(document_id, "Extracting")
        raw_text = await extract_text(file)         # ← do the work

        await set_status(document_id, "Chunking")
        chunks = chunk_text(raw_text, ...)           # ← do the work

        # On error:
        await set_status(document_id, "Failed", error_message=str(exc))
    """
    sb = get_supabase_client()

    update_payload: dict = {"processing_status": status}

    # If the document failed, store the error reason in `tags` as a note.
    # This is a lightweight approach — a dedicated `error_log` column would
    # be cleaner but requires a migration. Revisit when the schema stabilises.
    if status == "Failed" and error_message:
        update_payload["tags"] = [f"error:{error_message[:200]}"]

    (
        sb.table("documents")
        .update(update_payload)
        .eq("id", document_id)
        .execute()
    )