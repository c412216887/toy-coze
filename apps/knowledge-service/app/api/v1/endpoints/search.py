from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.schemas.knowledge import SearchRequest, SearchResponse
from app.services.retriever import search

router = APIRouter(prefix='/search', tags=['检索'])


@router.post('', response_model=SearchResponse)
async def search_knowledge(req: SearchRequest, db: AsyncSession = Depends(get_db)):
    if not req.query.strip():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail='查询内容不能为空')

    results = await search(db, req.kb_code, req.query, req.top_k, req.score_threshold)
    return SearchResponse(query=req.query, results=results, total=len(results))
