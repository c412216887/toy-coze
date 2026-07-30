from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.knowledge import KnowledgeBase, Document
from app.schemas.knowledge import KnowledgeBaseCreate, KnowledgeBaseResponse, DocumentResponse
from app.services.ingest import ingest_document, delete_document
from app.core.config import get_settings

settings = get_settings()

router = APIRouter(prefix='/knowledge', tags=['知识库'])


@router.post('/bases', response_model=KnowledgeBaseResponse, status_code=status.HTTP_201_CREATED)
async def create_knowledge_base(kb_in: KnowledgeBaseCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(KnowledgeBase).where(KnowledgeBase.kb_code == kb_in.kb_code))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='kb_code 已存在')
    kb = KnowledgeBase(**kb_in.model_dump())
    db.add(kb)
    await db.commit()
    await db.refresh(kb)
    return kb


@router.get('/bases/{kb_code}', response_model=KnowledgeBaseResponse)
async def get_knowledge_base(kb_code: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(KnowledgeBase).where(KnowledgeBase.kb_code == kb_code))
    kb = result.scalar_one_or_none()
    if not kb:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='知识库不存在')
    return kb


@router.post('/bases/{kb_code}/documents', response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    kb_code: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    ext = (file.filename or '').rsplit('.', 1)[-1].lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f'不支持的文件类型，允许: {settings.ALLOWED_EXTENSIONS}'
        )

    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f'文件超过 {settings.MAX_FILE_SIZE_MB}MB 限制'
        )

    try:
        doc = await ingest_document(db, kb_code, file.filename or 'unknown', content)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f'文档处理失败: {exc}')

    return doc


@router.get('/bases/{kb_code}/documents', response_model=list[DocumentResponse])
async def list_documents(kb_code: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).where(Document.kb_code == kb_code))
    return result.scalars().all()


@router.delete('/documents/{doc_id}', status_code=status.HTTP_204_NO_CONTENT)
async def remove_document(doc_id: str, db: AsyncSession = Depends(get_db)):
    await delete_document(db, doc_id)
