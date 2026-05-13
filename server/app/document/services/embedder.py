"""
modules/document_module/services/embedder.py
============================================
STAGE 3 of the document pipeline: Embed

Responsibility: Convert each text chunk into a 768-dimensional vector
using Google's text-embedding-004 model via the Gemini API.

What is an embedding?
    An embedding is a list of numbers (a vector) that encodes the *meaning*
    of a piece of text. Similar texts produce vectors that are mathematically
    close to each other. This is what allows the vector database to find
    "semantically related" chunks for a query, rather than doing keyword matching.

text-embedding-004 output:
    768 floats per chunk.
    Example: "Q3 revenue declined" → [0.023, -0.441, 0.887, ...(768 total)]

Rate limiting note:
    The Gemini free tier has per-minute limits. For large documents, embed
    in small batches. The batch_size parameter controls this. In production,
    add exponential backoff (tenacity library is a good choice).
"""

import asyncio

from google.genai import types

from core.gemini_client import get_embedding_model, get_gemini_client


async def embed_chunks(chunks: list[dict], batch_size: int = 10) -> list[dict]:
    """
    Add an 'embedding' field to each chunk dict by calling the Gemini API.

    Processes chunks in batches to respect API rate limits.
    Each batch is awaited before sending the next one.

    Args:
        chunks (list[dict]):  Chunks produced by the chunker service.
                              Each dict must have a 'text' key.
        batch_size (int):     How many chunks to embed per API call batch.
                              Default 10 is safe for most Gemini tier limits.

    Returns:
        list[dict]: Same chunk dicts, each now including:
            - embedding (list[float]): 768-dimensional vector

    Raises:
        RuntimeError: If the Gemini API returns an unexpected response shape.

    Example:
        chunks = [{"chunk_id": "abc", "text": "Revenue declined in Q3..."}]
        embedded = await embed_chunks(chunks)
        # embedded[0]["embedding"] → [0.023, -0.441, 0.887, ...]
    """
    client = get_gemini_client()
    model_name = get_embedding_model()
    embedded_chunks: list[dict] = []

    # Process in batches
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i : i + batch_size]
        texts = [chunk["text"] for chunk in batch]

        # ------------------------------------------------------------------
        # Call Gemini embedding API
        # task_type="RETRIEVAL_DOCUMENT" tells the model these are documents
        # being indexed (as opposed to queries, which use RETRIEVAL_QUERY).
        # Using the correct task type improves retrieval accuracy.
        # ------------------------------------------------------------------
        response = client.models.embed_content(
            model=model_name,
            contents=[
                types.Content(parts=[types.Part.from_text(text=text)])
                for text in texts
            ],
            config=types.EmbedContentConfig(
                task_type="RETRIEVAL_DOCUMENT",
                output_dimensionality=1536,
            ),
        )

        # The response now returns a list of embedding objects.
        if not getattr(response, "embeddings", None):
            raise RuntimeError(
                f"Gemini embedding API returned unexpected response: {response}"
            )

        vectors: list[list[float]] = [
            embedding.values for embedding in response.embeddings
        ]

        # Merge the vector back into each chunk dict
        for chunk, vector in zip(batch, vectors):
            embedded_chunk = {**chunk, "embedding": vector}
            embedded_chunks.append(embedded_chunk)

        # Brief pause between batches to respect rate limits
        if i + batch_size < len(chunks):
            await asyncio.sleep(0.5)

    return embedded_chunks


async def embed_single_text(text: str, task_type: str = "RETRIEVAL_QUERY") -> list[float]:
    """
    Embed a single piece of text and return its vector.

    Used by the RAG module to embed the user's query before searching
    the vector database.

    task_type="RETRIEVAL_QUERY" is the correct type for search queries.
    task_type="RETRIEVAL_DOCUMENT" is used when indexing documents.
    Using the paired task types improves search relevance.

    Args:
        text (str):       The text to embed (e.g. user's question).
        task_type (str):  Gemini task type hint for the embedding.

    Returns:
        list[float]: 768-dimensional embedding vector.

    Example:
        query_vector = await embed_single_text("What is our Q3 cash flow risk?")
        # → [0.031, -0.512, 0.774, ...]  (768 numbers)
    """
    client = get_gemini_client()
    model_name = get_embedding_model()

    response = client.models.embed_content(
        model=model_name,
        contents=[types.Content(parts=[types.Part.from_text(text=text)])],
        config=types.EmbedContentConfig(
            task_type=task_type,
            output_dimensionality=1536,
        ),
    )

    if not getattr(response, "embeddings", None):
        raise RuntimeError(
            f"Gemini embedding API returned unexpected response: {response}"
        )

    return response.embeddings[0].values