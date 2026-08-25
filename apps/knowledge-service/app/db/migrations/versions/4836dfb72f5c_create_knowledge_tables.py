"""create knowledge tables

Revision ID: 4836dfb72f5c
Revises: 
Create Date: 2026-08-25 15:15:21.543436

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import pgvector.sqlalchemy

# revision identifiers, used by Alembic.
revision: str = '4836dfb72f5c'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'ks_knowledge_base',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('kb_code', sa.String(length=64), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('embedding_model', sa.String(length=128), nullable=False),
        sa.Column('chunk_size', sa.Integer(), nullable=False),
        sa.Column('chunk_overlap', sa.Integer(), nullable=False),
        sa.Column('doc_count', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_ks_knowledge_base_kb_code'), 'ks_knowledge_base', ['kb_code'], unique=True)

    op.create_table(
        'ks_document',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('kb_code', sa.String(length=64), nullable=False),
        sa.Column('filename', sa.String(length=512), nullable=False),
        sa.Column('file_type', sa.String(length=16), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=False),
        sa.Column('chunk_count', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_ks_document_kb_code'), 'ks_document', ['kb_code'], unique=False)

    op.create_table(
        'ks_document_chunk',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('doc_id', sa.String(length=36), nullable=False),
        sa.Column('kb_code', sa.String(length=64), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('chunk_index', sa.Integer(), nullable=False),
        sa.Column('token_count', sa.Integer(), nullable=False),
        sa.Column('embedding', pgvector.sqlalchemy.Vector(1536), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        'idx_chunk_embedding', 'ks_document_chunk', ['embedding'],
        unique=False,
        postgresql_using='hnsw',
        postgresql_with={'m': 16, 'ef_construction': 64},
        postgresql_ops={'embedding': 'vector_cosine_ops'},
    )
    op.create_index(op.f('ix_ks_document_chunk_doc_id'), 'ks_document_chunk', ['doc_id'], unique=False)
    op.create_index(op.f('ix_ks_document_chunk_kb_code'), 'ks_document_chunk', ['kb_code'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_ks_document_chunk_kb_code'), table_name='ks_document_chunk')
    op.drop_index(op.f('ix_ks_document_chunk_doc_id'), table_name='ks_document_chunk')
    op.drop_index('idx_chunk_embedding', table_name='ks_document_chunk')
    op.drop_table('ks_document_chunk')
    op.drop_index(op.f('ix_ks_document_kb_code'), table_name='ks_document')
    op.drop_table('ks_document')
    op.drop_index(op.f('ix_ks_knowledge_base_kb_code'), table_name='ks_knowledge_base')
    op.drop_table('ks_knowledge_base')
