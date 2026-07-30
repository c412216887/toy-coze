from datetime import datetime
from pydantic import BaseModel


class KnowledgeBaseCreate(BaseModel):
    kb_code: str
    name: str
    description: str | None = None
    embedding_model: str = 'text-embedding-3-small'
    chunk_size: int = 1000
    chunk_overlap: int = 200


class KnowledgeBaseResponse(BaseModel):
    id: str
    kb_code: str
    name: str
    description: str | None
    embedding_model: str
    chunk_size: int
    chunk_overlap: int
    doc_count: int
    created_at: datetime

    model_config = {'from_attributes': True}


class DocumentResponse(BaseModel):
    id: str
    kb_code: str
    filename: str
    file_type: str
    file_size: int
    chunk_count: int
    status: str
    error_message: str | None
    created_at: datetime

    model_config = {'from_attributes': True}


class SearchRequest(BaseModel):
    kb_code: str
    query: str
    top_k: int = 5
    score_threshold: float = 0.3


class SearchResult(BaseModel):
    chunk_id: str
    doc_id: str
    content: str
    score: float
    chunk_index: int


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]
    total: int
