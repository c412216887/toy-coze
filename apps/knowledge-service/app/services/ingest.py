import uuid
import structlog
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, text
from app.models.knowledge import KnowledgeBase, Document, DocumentChunk
from app.services.parser import DocumentParser
from app.services.chunker import ChunkService
from app.services.embedder import EmbeddingService
from app.core.config import get_settings

settings = get_settings()
logger = structlog.get_logger()

_parser = DocumentParser()
_chunker = ChunkService()
_embedder = EmbeddingService()


async def ingest_document(
    db: AsyncSession,
    kb_code: str,
    filename: str,
    file_content: bytes
) -> Document:
    result = await db.execute(select(KnowledgeBase).where(KnowledgeBase.kb_code == kb_code))
    kb = result.scalar_one_or_none()
    if kb is None:
        raise ValueError(f'知识库不存在: {kb_code}')

    doc = Document(
        kb_code=kb_code,
        filename=filename,
        file_type=filename.rsplit('.', 1)[-1].lower(),
        file_size=len(file_content),
        status='processing'
    )
    db.add(doc)
    await db.flush()

    try:
        raw_text = _parser.parse(file_content, filename)
        chunks = _chunker.split(raw_text, kb.chunk_size, kb.chunk_overlap)

        embeddings = await _embedder.embed_texts(chunks)

        chunk_objs = [
            DocumentChunk(
                doc_id=doc.id,
                kb_code=kb_code,
                content=chunk,
                chunk_index=idx,
                token_count=len(chunk) // 4,
                embedding=embedding
            )
            for idx, (chunk, embedding) in enumerate(zip(chunks, embeddings))
        ]
        db.add_all(chunk_objs)

        doc.chunk_count = len(chunks)
        doc.status = 'completed'

        kb.doc_count = kb.doc_count + 1

        await db.commit()
        await db.refresh(doc)
        logger.info('文档入库完成', doc_id=doc.id, chunks=len(chunks))

    except Exception as exc:
        doc.status = 'failed'
        doc.error_message = str(exc)
        await db.commit()
        logger.error('文档入库失败', doc_id=doc.id, error=str(exc))
        raise

    return doc


async def delete_document(db: AsyncSession, doc_id: str) -> None:
    await db.execute(delete(DocumentChunk).where(DocumentChunk.doc_id == doc_id))
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if doc:
        kb_result = await db.execute(
            select(KnowledgeBase).where(KnowledgeBase.kb_code == doc.kb_code)
        )
        kb = kb_result.scalar_one_or_none()
        if kb and kb.doc_count > 0:
            kb.doc_count = kb.doc_count - 1
        await db.delete(doc)
    await db.commit()
