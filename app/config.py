from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGODB_URL: str
    MONGODB_DB: str
    REDIS_URL: str
    INTERNAL_SERVICE_KEY: str
    PORT: int = 8000

    class Config:
        env_file = ".env"

settings = Settings()