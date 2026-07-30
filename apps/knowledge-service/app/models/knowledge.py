import uuid
from datetime import datetime
from sqlalchemy import String, Text, Integer, DateTime, func, Index
from sqlalchemy.orm import Mapped, mapped_column
from pgvector.sqlalchemy import Vector
from app.db.database import Base
from app.core.config import get_settings

settings = get_settings()


class KnowledgeBase(Base):
    __tablename__ = 'ks_knowledge_base'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    kb_code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    embedding_model: Mapped[str] = mapped_column(String(128), default='text-embedding-3-small', nullable=False)
    chunk_size: Mapped[int] = mapped_column(Integer, default=1000, nullable=False)
    chunk_overlap: Mapped[int] = mapped_column(Integer, default=200, nullable=False)
    doc_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)


class Document(Base):
    __tablename__ = 'ks_document'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    kb_code: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    filename: Mapped[str] = mapped_column(String(512), nullable=False)
    file_type: Mapped[str] = mapped_column(String(16), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    chunk_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default='pending', nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)


class DocumentChunk(Base):
    __tablename__ = 'ks_document_chunk'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    doc_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    kb_code: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    token_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    embedding: Mapped[list[float] | None] = mapped_column(Vector(settings.EMBEDDING_DIMENSIONS))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (
        Index('idx_chunk_embedding', 'embedding', postgresql_using='hnsw',
              postgresql_with={'m': 16, 'ef_construction': 64},
              postgresql_ops={'embedding': 'vector_cosine_ops'}),
    )
