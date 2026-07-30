import structlog
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.models.knowledge import DocumentChunk
from app.services.embedder import EmbeddingService
from app.schemas.knowledge import SearchResult

logger = structlog.get_logger()

_embedder = EmbeddingService()


async def search(
    db: AsyncSession,
    kb_code: str,
    query: str,
    top_k: int = 5,
    score_threshold: float = 0.3
) -> list[SearchResult]:
    query_embedding = await _embedder.embed_query(query)

    embedding_str = '[' + ','.join(str(v) for v in query_embedding) + ']'

    stmt = text("""
        SELECT
            id,
            doc_id,
            content,
            chunk_index,
            1 - (embedding <=> :embedding::vector) AS score
        FROM ks_document_chunk
        WHERE kb_code = :kb_code
          AND embedding IS NOT NULL
          AND 1 - (embedding <=> :embedding::vector) >= :threshold
        ORDER BY embedding <=> :embedding::vector
        LIMIT :top_k
    """)

    result = await db.execute(stmt, {
        'embedding': embedding_str,
        'kb_code': kb_code,
        'threshold': score_threshold,
        'top_k': top_k
    })
    rows = result.fetchall()

    return [
        SearchResult(
            chunk_id=row.id,
            doc_id=row.doc_id,
            content=row.content,
            score=float(row.score),
            chunk_index=row.chunk_index
        )
        for row in rows
    ]
