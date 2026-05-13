"""
core/supabase_client.py
=======================
Provides a single shared Supabase client instance.

Why a singleton?
    Creating a new Supabase client on every request is wasteful.
    All modules import `get_supabase_client()` and get the same connection.

Supabase dual role in NexVision:
    1. PostgreSQL (via supabase.table()) — stores document metadata,
       user records, recommendation history, etc.
    2. pgvector extension (via supabase.rpc()) — stores and searches
       768-dimensional embedding vectors for the RAG pipeline.
"""

from supabase import create_client, Client
from core.config import settings

# Module-level singleton — initialised once on first import
_client: Client | None = None


def get_supabase_client() -> Client:
    """
    Return the shared Supabase client, creating it on first call.

    Usage:
        from core.supabase_client import get_supabase_client
        sb = get_supabase_client()
        result = sb.table("documents").select("*").execute()

    Returns:
        supabase.Client: authenticated Supabase client
    """
    global _client
    if _client is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_KEY:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in your .env file."
            )
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    return _client