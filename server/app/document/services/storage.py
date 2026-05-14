"""
app/document/services/storage.py
============================================
File Storage Service

Responsibility: Upload raw files to Supabase Storage and return a
persistent URL. This is a separate concern from text extraction.

Why store the file?
    The spec requires: "File must be stored then uploaded (metadata and
    file path or URL)." Storing the original file means:
      - Users can re-download the original at any time.
      - Reprocessing doesn't require the user to re-upload.
      - The file_url is recorded in the `documents` table as the source of truth.

Supabase Storage setup (one-time, in Supabase Dashboard):
    1. Go to Storage → Create new bucket
    2. Name it "documents" (or whatever SUPABASE_STORAGE_BUCKET is set to)
    3. Set to PRIVATE — files are accessed via signed URLs, not public links.
    4. Row Level Security: the service_role key bypasses RLS,
       so backend access works without additional policies.

File path convention inside the bucket:
    {company_id}/{document_id}/{filename}

    Example: acme_corp/abc-123/Q3_Report.pdf

    This structure makes it easy to list or delete all files for a company
    or a specific document using Supabase's folder-style prefix queries.
"""

import io
from fastapi import UploadFile, HTTPException
from core.supabase_client import get_supabase_client
from core.config import settings


async def upload_file_to_storage(
    file: UploadFile,
    company_id: str,
    document_id: str,
) -> str:
    """
    Upload a file to Supabase Storage and return its storage path.

    The file is read into memory once and uploaded to the configured
    Supabase Storage bucket. The caller receives the storage path
    which is saved to the `documents.file_url` column.

    To generate a downloadable link later, use `get_signed_url()`.

    Args:
        file (UploadFile):  The uploaded file from FastAPI multipart.
        company_id (str):   Used to organise files by company in the bucket.
        document_id (str):  Used to organise files by document (sub-folder).

    Returns:
        str: Storage path within the bucket, e.g.:
             "acme_corp/abc-123/Q3_Report.pdf"

    Raises:
        HTTPException 500: If the Supabase Storage upload fails.
    """
    sb = get_supabase_client()
    bucket = settings.SUPABASE_STORAGE_BUCKET

    # Read bytes (the file stream may have already been partially read
    # by the router — the router should call file.seek(0) before calling this)
    raw_bytes = await file.read()

    if not raw_bytes:
        raise HTTPException(status_code=400, detail="Cannot store an empty file.")

    # Build the storage path: company/document/filename
    filename = file.filename or f"document_{document_id}"
    storage_path = f"{company_id}/{document_id}/{filename}"

    # Determine MIME type for the storage header
    content_type = file.content_type or "application/octet-stream"

    try:
        # Supabase Storage upload
        # `upsert=True` means re-uploading the same path overwrites the old file
        # (important for the reprocess endpoint)
        sb.storage.from_(bucket).upload(
            path=storage_path,
            file=raw_bytes,
            file_options={
                "content-type": content_type,
                "upsert": "true",
            },
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Failed to upload '{filename}' to Supabase Storage: {exc}. "
                f"Ensure the '{bucket}' bucket exists in your Supabase project."
            ),
        )

    return storage_path


def get_signed_url(storage_path: str, expires_in_seconds: int = 3600) -> str:
    """
    Generate a temporary signed URL for a stored file.

    Since the bucket is private, direct URLs don't work. A signed URL
    grants time-limited access to the file — useful for frontend download links.

    Args:
        storage_path (str):      The path returned by upload_file_to_storage().
        expires_in_seconds (int): How long the URL is valid (default: 1 hour).

    Returns:
        str: A signed HTTPS URL for downloading the file.

    Raises:
        HTTPException 500: If the signing request fails.
    """
    sb = get_supabase_client()
    bucket = settings.SUPABASE_STORAGE_BUCKET

    try:
        result = sb.storage.from_(bucket).create_signed_url(
            path=storage_path,
            expires_in=expires_in_seconds,
        )
        return result["signedURL"]
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Could not generate signed URL for '{storage_path}': {exc}",
        )


def delete_file_from_storage(storage_path: str) -> None:
    """
    Delete a file from Supabase Storage.

    Called when a document is deleted from the system to clean up
    the stored file and avoid orphaned storage usage.

    Args:
        storage_path (str): The path returned by upload_file_to_storage().
    """
    sb = get_supabase_client()
    bucket = settings.SUPABASE_STORAGE_BUCKET

    try:
        sb.storage.from_(bucket).remove([storage_path])
    except Exception:
        # Log but don't raise — a failed storage delete shouldn't block
        # the database record deletion. Orphaned files can be cleaned up manually.
        pass