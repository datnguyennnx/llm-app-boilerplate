from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    OPENAI_API_KEY: str 
    # ANTHROPIC_API_KEY: str
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str
    FRONTEND_URL: str
    # DEFAULT_TEMPERATURE: float
    # DEFAULT_MODEL_TYPE: str
    # DEFAULT_OPENAI_MODEL: str
    # DEFAULT_ANTHROPIC_MODEL: str
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
