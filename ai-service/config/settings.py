"""
Configuration Settings for AI Microservice
Uses environment variables with sensible defaults for local development
"""

import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application Info
    APP_NAME: str = "C4ISR AI Microservice"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database Configuration
    # Default uses localhost for local dev; use 'c4isr-db' for Docker network
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://admin:password@localhost:5433/c4isr_db"
    )
    
    # For Docker internal network
    DATABASE_URL_DOCKER: str = os.getenv(
        "DATABASE_URL_DOCKER",
        "postgresql://admin:password@c4isr-db:5432/c4isr_db"
    )
    
    # Database Pool Settings
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    
    # Model Configuration - Gemma-2-9b-it for RTX 3080 16GB
    MODEL_NAME: str = "google/gemma-2-9b-it"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    
    # LoRA Configuration
    LORA_ADAPTER_PATH: str = "./adapters"
    LORA_RANK: int = 8
    LORA_ALPHA: int = 16
    LORA_DROPOUT: float = 0.1
    
    # Quantization (4-bit for lightweight execution)
    USE_4BIT_QUANTIZATION: bool = True
    BNB_4BIT_COMPUTE_DTYPE: str = "float16"
    BNB_4BIT_QUANT_TYPE: str = "nf4"
    
    # RAG Configuration
    RAG_TOP_K: int = 3
    EMBEDDING_DIMENSION: int = 384
    
    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    
    # HuggingFace Token (required for Gemma model access)
    HF_TOKEN: str = os.getenv("HF_TOKEN", "")
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Global settings instance
settings = get_settings()
