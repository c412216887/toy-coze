CREATE DATABASE temporal;
CREATE DATABASE temporal_visibility;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS ks_knowledge_base (
    id VARCHAR(36) PRIMARY KEY,
    kb_code VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    embedding_model VARCHAR(128) NOT NULL,
    chunk_size INTEGER NOT NULL,
    chunk_overlap INTEGER NOT NULL,
    doc_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ix_ks_knowledge_base_kb_code ON ks_knowledge_base (kb_code);

CREATE TABLE IF NOT EXISTS ks_document (
    id VARCHAR(36) PRIMARY KEY,
    kb_code VARCHAR(64) NOT NULL,
    filename VARCHAR(512) NOT NULL,
    file_type VARCHAR(16) NOT NULL,
    file_size INTEGER NOT NULL,
    chunk_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_ks_document_kb_code ON ks_document (kb_code);

CREATE TABLE IF NOT EXISTS ks_document_chunk (
    id VARCHAR(36) PRIMARY KEY,
    doc_id VARCHAR(36) NOT NULL,
    kb_code VARCHAR(64) NOT NULL,
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    token_count INTEGER NOT NULL,
    embedding vector(1536),
    created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_ks_document_chunk_doc_id ON ks_document_chunk (doc_id);
CREATE INDEX IF NOT EXISTS ix_ks_document_chunk_kb_code ON ks_document_chunk (kb_code);
CREATE INDEX IF NOT EXISTS idx_chunk_embedding ON ks_document_chunk
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

