"""
Configuration management
"""
import os
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings"""

    model_config = SettingsConfigDict(env_file=None)

    # Phase
    PHASE: str = "local"

    # Server Domain
    FRONTEND_DOMAIN: str = "http://localhost:8600"
    BACKEND_DOMAIN: str = "http://localhost:8601"
    MCP_SERVER_DOMAIN: str = "http://localhost:8602"

    # Log Level
    LOG_LEVEL: str = "DEBUG"

    # Database
    DB_HOST: str = "aidev-pgvector-dev.crkgaskg6o61.ap-northeast-2.rds.amazonaws.com"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "vmcMrs75!KZHk2johkRR:]wL"
    DB_PORT: int = 5432
    DB_NAME: str = "PS-UI-test3"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:8600"]

    @property
    def database_url(self) -> str:
        """Get database URL"""
        return (
            f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    phase = os.getenv("PHASE", "local")
    config_path = Path(__file__).parent.parent.parent / "config" / f"config.{phase}.env"

    if config_path.exists():
        return Settings(_env_file=str(config_path))

    return Settings()

