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

    # ─────────────────────────────────────────────────────────────────
    # Groq Chat Engine — primary chat backend (replaces local Llama)
    # ─────────────────────────────────────────────────────────────────
    # When GROQ_API_KEY is set and GROQ_ENABLED=true, /chat goes through Groq.
    # On Groq failure (network error / 5xx / 429), the engine lazy-loads the
    # local Llama-3.1-8B as a fallback. This keeps the GPU free of Llama
    # while everything is healthy, leaving full VRAM headroom for Gemma.
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    GROQ_BASE_URL: str = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
    GROQ_ENABLED: bool = os.getenv("GROQ_ENABLED", "true").lower() in ("1", "true", "yes")
    GROQ_TIMEOUT_S: float = float(os.getenv("GROQ_TIMEOUT_S", "30"))
    GROQ_TEMPERATURE: float = float(os.getenv("GROQ_TEMPERATURE", "0.3"))
    GROQ_MAX_TOKENS: int = int(os.getenv("GROQ_MAX_TOKENS", "1024"))

    # When true (default), local Llama is NOT loaded at startup. It will be
    # loaded on-demand only if Groq fails and a chat request comes in.
    CHAT_LOCAL_FALLBACK_LAZY: bool = os.getenv("CHAT_LOCAL_FALLBACK_LAZY", "true").lower() in ("1", "true", "yes")

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Global settings instance
settings = get_settings()
