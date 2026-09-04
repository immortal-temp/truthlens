from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

class Settings(BaseSettings):
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    ENVIRONMENT: str = "development"
    CORS_ORIGINS: str = "*"

    # MongoDB Atlas
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "truthlens"
    MONGODB_TTL_SECONDS: int = 1200  # 20 minutes default retention

    # LLMs - Primary, Secondary, and Tertiary Keys
    GEMINI_API_KEY: str = ""
    GEMINI_API_KEY_2: str = ""
    GEMINI_API_KEY_3: str = ""
    GEMINI_MODEL: str = "gemini-2.5-flash"

    GROQ_API_KEY: str = ""
    GROQ_API_KEY_2: str = ""
    GROQ_API_KEY_3: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"

    OPENROUTER_API_KEY: str = ""
    OPENROUTER_API_KEY_2: str = ""
    OPENROUTER_API_KEY_3: str = ""
    OPENROUTER_MODEL: str = "meta-llama/llama-3.3-70b-instruct"

    # News APIs - Primary, Secondary, and Tertiary Keys
    GNEWS_API_KEY: str = ""
    GNEWS_API_KEY_2: str = ""
    GNEWS_API_KEY_3: str = ""

    NEWSDATA_API_KEY: str = ""
    NEWSDATA_API_KEY_2: str = ""
    NEWSDATA_API_KEY_3: str = ""

    NEWSAPI_API_KEY: str = ""
    NEWSAPI_API_KEY_2: str = ""
    NEWSAPI_API_KEY_3: str = ""

    # Demo Mode
    DEMO_MODE: bool = False

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

settings = Settings()
