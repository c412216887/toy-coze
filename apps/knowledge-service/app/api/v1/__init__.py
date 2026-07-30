from fastapi import APIRouter
from app.api.v1.endpoints import knowledge, search

api_router = APIRouter(prefix='/api/v1')
api_router.include_router(knowledge.router)
api_router.include_router(search.router)
