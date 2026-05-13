from pydantic import BaseModel, Field
from typing import Literal

class RetrievedChunk(BaseModel):
    """
    A single document chunk returned from the vector database.
    Included in the response so the frontend can show source evidence.
    """

    chunk_id: str
    chunk_text: str = Field(..., description="Raw text content of this chunk")
    source_file: str = Field(..., description="Original filename this chunk came from")
    page_number: int | None = Field(None, description="Page/row number within the source")
    metadata: dict = Field(default_factory=dict, description="Extra metadata (sheet name, etc.)")
    similarity: float = Field(..., description="Cosine similarity score 0–1. Higher = more relevant.")