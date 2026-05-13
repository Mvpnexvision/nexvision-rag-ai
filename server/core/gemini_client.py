"""
core/gemini_client.py
=====================
Provides initialised Google Gemini API access for the entire server.

Two capabilities used by NexVision:
    1. Embeddings (text-embedding-004)
       Converts text → a list of 768 floats (a vector).
       Used by: Document Module (embed chunks), RAG Module (embed query).

    2. Generative chat (gemini-2.5-flash)
       Reads context chunks and generates structured JSON answers.
       Used by: RAG Module (answer generation).

Centralising the client here means API key config lives in one place
and all modules share the same initialised SDK instance.
"""

import google.generativeai as genai
from core.config import settings


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
    genai.configure(api_key=settings.GEMINI_API_KEY)


def get_embedding_model():
    """
    Return the Gemini embedding model name string.

    The google-genai SDK's embed_content() function takes the model name
    as a parameter, so we return the string rather than a model object.

    Returns:
        str: model identifier, e.g. "models/text-embedding-004"
    """
    return settings.GEMINI_EMBEDDING_MODEL


def get_chat_model() -> genai.GenerativeModel:
    """
    Return an initialised GenerativeModel for chat/reasoning tasks.

    This model is used by the RAG module to take retrieved context chunks
    and generate structured JSON insights.

    Returns:
        genai.GenerativeModel: ready-to-use Gemini chat model
    """
    return genai.GenerativeModel(settings.GEMINI_CHAT_MODEL)


# Initialise on import so any module that does `from core.gemini_client import ...`
# automatically configures the SDK.
init_gemini()