"""
core/config.py
==============
Central configuration loaded from environment variables via python-dotenv.

All modules import `settings` from here — no module should read os.environ
directly. This keeps configuration in one place and makes testing easy.
"""

import os


def _load_env_file(file_path: str, override: bool = True) -> None:
    """Load simple KEY=VALUE pairs from a dotenv-style file."""
    if not os.path.exists(file_path):
        return

    with open(file_path, 'r', encoding='utf-8') as handle:
        for raw_line in handle:
            line = raw_line.strip()

            if not line or line.startswith('#'):
                continue

            if '=' not in line:
                continue

            key, value = line.split('=', 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")

            if not key:
                continue

            if override or key not in os.environ:
                os.environ[key] = value


# Load project env files explicitly so the repo's values are used instead of
# the computer's global environment. We load `.env` first, then `.env.local`
# second so the local file can override defaults when both exist.
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
env_file = os.path.join(project_root, '.env')
env_local_file = os.path.join(project_root, '.env.local')

_load_env_file(env_file, override=True)
_load_env_file(env_local_file, override=True)


class Settings:
    """
    Typed wrapper around environment variables.

    Add new variables here as the project grows. Using a class (rather than
    Pydantic BaseSettings) keeps the dependency list minimal for now and is
    easy to migrate later.
    """

    # ------------------------------------------------------------------
    # Supabase — PostgreSQL + pgvector (vector database)
    # ------------------------------------------------------------------

    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    """
    Your Supabase project URL.
    Found in: Supabase Dashboard → Project Settings → API → Project URL
    Example: https://xyzcompany.supabase.co
    """

    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")
    """
    Service role key (bypasses Row Level Security — keep secret, backend only).
    Found in: Supabase Dashboard → Project Settings → API → service_role key
    """

    SUPABASE_STORAGE_BUCKET: str = os.getenv("SUPABASE_STORAGE_BUCKET", "documents")
    """
    Name of the Supabase Storage bucket where uploaded files are saved.
    Create this bucket in: Supabase Dashboard → Storage → New Bucket
    Recommended: set to private (not public) — access via signed URLs.
    Default bucket name: "documents"
    """

    # ------------------------------------------------------------------
    # Google Gemini AI
    # ------------------------------------------------------------------

    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    """
    API key for Google Gemini.
    Get it from: https://aistudio.google.com/app/apikey
    Used for both text-embedding-004 (embeddings) and gemini-2.5-flash (reasoning).
    """

    GEMINI_EMBEDDING_MODEL: str = os.getenv(
        "GEMINI_EMBEDDING_MODEL", "models/text-embedding-004"
    )
    """
    Gemini embedding model used to convert text → vector.
    text-embedding-004 produces 768-dimensional vectors.
    """

    GEMINI_CHAT_MODEL: str = os.getenv("GEMINI_CHAT_MODEL", "gemini-2.5-flash")
    """
    Gemini model used by the RAG module for reasoning and answer generation.
    """

    # ------------------------------------------------------------------
    # Document processing
    # ------------------------------------------------------------------

    CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "400"))
    """
    Target word count per chunk. 400 words ≈ ~600 tokens — fits comfortably
    within Gemini's context window while keeping chunks semantically focused.
    """

    CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "50"))
    """
    Words of overlap between consecutive chunks.
    Overlap prevents key sentences from being split across chunk boundaries.
    """

    TOP_K_CHUNKS: int = int(os.getenv("TOP_K_CHUNKS", "5"))
    """
    Number of chunks to retrieve from the vector database per query.
    5 is a good default — enough context without overloading the AI prompt.
    """

    # ------------------------------------------------------------------
    # CORS
    # ------------------------------------------------------------------

    ALLOWED_ORIGINS: list[str] = os.getenv(
        "ALLOWED_ORIGINS", "http://localhost:3000"
    ).split(",")
    """
    Comma-separated list of allowed frontend origins.
    Example: http://localhost:3000,https://app.nexvision.com
    """


# Singleton instance — import this everywhere
settings = Settings()