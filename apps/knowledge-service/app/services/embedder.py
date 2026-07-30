import structlog
from openai import AsyncOpenAI
from app.core.config import get_settings

settings = get_settings()
logger = structlog.get_logger()


class EmbeddingService:

    def __init__(self):
        self._client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL
        )

    async def embed_texts(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        batch_size = 100
        all_embeddings: list[list[float]] = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            response = await self._client.embeddings.create(
                model=settings.EMBEDDING_MODEL,
                input=batch
            )
            all_embeddings.extend([item.embedding for item in response.data])
        return all_embeddings

    async def embed_query(self, text: str) -> list[float]:
        results = await self.embed_texts([text])
        return results[0]
