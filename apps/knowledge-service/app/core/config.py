from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8')

    APP_NAME: str = 'Knowledge Service'
    APP_VERSION: str = '0.1.0'
    DEBUG: bool = False

    DATABASE_URL: str = 'postgresql+asyncpg://coze:coze123@localhost:5432/coze_db'

    OPENAI_API_KEY: str = ''
    OPENAI_BASE_URL: str = 'https://api.openai.com/v1'
    EMBEDDING_MODEL: str = 'text-embedding-3-small'
    EMBEDDING_DIMENSIONS: int = 1536

    DEFAULT_CHUNK_SIZE: int = 1000
    DEFAULT_CHUNK_OVERLAP: int = 200

    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_EXTENSIONS: list[str] = ['pdf', 'docx', 'doc', 'md', 'txt']

    CORS_ORIGINS: list[str] = ['http://localhost:3000', 'http://localhost:8000']


@lru_cache
def get_settings() -> Settings:
    return Settings()
