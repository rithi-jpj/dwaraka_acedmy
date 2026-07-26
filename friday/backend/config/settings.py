"""FRIDAY AI Assistant - Centralized Configuration

All settings are loaded from environment variables with sensible defaults.
Supports .env files for local development.
"""

from __future__ import annotations

import os
import json
from pathlib import Path
from typing import Optional, Dict, Any, List

from pydantic_settings import BaseSettings
from pydantic import Field, field_validator, ConfigDict


class Settings(BaseSettings):
    """Global application settings loaded from environment variables."""

    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Application ---
    APP_NAME: str = "FRIDAY"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "Production-Grade AI Assistant"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"

    # --- Server ---
    HOST: str = "0.0.0.0"
    PORT: int = 8477
    WORKERS: int = 4
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    LOG_LEVEL: str = "INFO"

    # --- Database ---
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/friday.db"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    # --- Redis ---
    REDIS_URL: Optional[str] = None

    # --- AI Providers ---
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4-turbo-preview"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"

    ANTHROPIC_API_KEY: Optional[str] = None
    ANTHROPIC_MODEL: str = "claude-3-opus-20240229"

    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-pro"

    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama2"

    LM_STUDIO_BASE_URL: str = "http://localhost:1234"

    PREFERRED_PROVIDER: str = "auto"  # auto, openai, anthropic, gemini, ollama, lm_studio

    # --- Voice ---
    WAKE_WORDS: str = "friday,hey friday"
    STT_ENGINE: str = "whisper"  # whisper, faster_whisper, vosk
    TTS_ENGINE: str = "edge"  # edge, piper, kokoro, pyttsx3
    TTS_VOICE: str = "en-US-AriaNeural"
    AUDIO_DEVICE: Optional[int] = None
    SAMPLE_RATE: int = 16000

    # --- Memory ---
    MEMORY_BACKEND: str = "sqlite"  # sqlite, postgresql, chroma
    VECTOR_STORE_PATH: str = "./data/vectors"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    MEMORY_RETENTION_DAYS: int = 365
    MAX_MEMORY_CONTEXT: int = 20  # max memory items to inject into context

    # --- Vision ---
    VISION_ENABLED: bool = True
    SCREENSHOT_INTERVAL: int = 30  # seconds between screenshots (0 to disable)
    OCR_LANGUAGE: str = "eng"
    WEBCAM_DEVICE: int = 0

    # --- Security ---
    SECRET_KEY: str = "change-me-in-production-to-a-secure-random-string"
    ENCRYPTION_KEY: Optional[str] = None
    TOKEN_EXPIRY_HOURS: int = 24
    SESSION_TIMEOUT_MINUTES: int = 30
    AUDIT_LOG_RETENTION_DAYS: int = 90
    MAX_COMMAND_LENGTH: int = 1000
    DANGEROUS_COMMANDS_FILE: str = "./config/dangerous_commands.txt"

    # --- Automation ---
    MAX_CONCURRENT_TASKS: int = 10
    TASK_TIMEOUT_MINUTES: int = 60
    AUTO_SCHEDULE_ENABLED: bool = False

    # --- Plugins ---
    PLUGINS_ENABLED: bool = True
    PLUGIN_DIR: str = "./plugins"
    PLUGIN_TIMEOUT_SECONDS: int = 30

    # --- Paths ---
    DATA_DIR: str = "./data"
    LOGS_DIR: str = "./logs"
    TEMP_DIR: str = "./temp"
    MODELS_DIR: str = "./models"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str) -> List[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in v.split(",") if origin.strip()]

    @property
    def available_providers(self) -> Dict[str, bool]:
        """Returns which AI providers are configured and available."""
        return {
            "openai": bool(self.OPENAI_API_KEY),
            "anthropic": bool(self.ANTHROPIC_API_KEY),
            "gemini": bool(self.GEMINI_API_KEY),
            "ollama": True,  # Always available if server is running
            "lm_studio": True,
        }

    @property
    def wake_words_list(self) -> List[str]:
        """Returns wake words as a list."""
        return [w.strip().lower() for w in self.WAKE_WORDS.split(",")]


settings = Settings()

# Ensure directories exist
for dir_path in [
    settings.DATA_DIR,
    settings.LOGS_DIR,
    settings.TEMP_DIR,
    settings.MODELS_DIR,
    settings.VECTOR_STORE_PATH,
]:
    Path(dir_path).mkdir(parents=True, exist_ok=True)
