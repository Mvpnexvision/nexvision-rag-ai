"""
core/gemini_client.py
=====================
Provides initialised Google Gemini API access for the entire server.

Two capabilities used by NexVision:
     1. Embeddings (text embedding model)
         Converts text → a list of floats (a vector).
         Used by: Document Module (embed chunks), RAG Module (embed query).

     2. Generative chat (gemini-2.5-flash)
         Reads context chunks and generates structured JSON answers.
         Used by: RAG Module (answer generation).

Centralising the client here means API key config lives in one place
and all modules share the same initialised SDK instance.
"""

from google import genai
from core.config import settings


_client: genai.Client | None = None


def init_gemini() -> None:
    """
    Configure the Gemini SDK with the API key from settings.

    Call this once at startup (already called by this module on import).
    Safe to call multiple times — subsequent calls are no-ops.
    """
    if not settings.GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY must be set in your .env file. "
            "Get your key at https://aistudio.google.com/app/apikey"
        )
    global _client
    _client = genai.Client(api_key=settings.GEMINI_API_KEY)


def get_gemini_client() -> genai.Client:
    """Return the shared Gemini client, initialising it if needed."""
    global _client
    if _client is None:
        init_gemini()

    assert _client is not None
    return _client


def get_embedding_model():
    """
    Return the Gemini embedding model name string.

    The google-genai SDK's embed_content() function takes the model name
    as a parameter, so we return the string rather than a model object.

    Returns:
        str: model identifier, e.g. "models/gemini-embedding-001"
    """
    return settings.GEMINI_EMBEDDING_MODEL


def get_chat_model():
    """
    Return the shared `models` service from the Gemini client.

    Callers can use `generate_content(...)` on the returned object.

    Returns:
        Gemini models service.
    """
    return get_gemini_client().models


# Initialise on import so any module that does `from core.gemini_client import ...`
# automatically configures the SDK.
init_gemini()