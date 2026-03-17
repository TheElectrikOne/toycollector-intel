"""Configuration for the ToyCollector scraper service."""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Supabase
    SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "")

    # Anthropic
    ANTHROPIC_API_KEY: str = os.environ.get("ANTHROPIC_API_KEY", "")

    # Claude models
    EXTRACTION_MODEL: str = "claude-haiku-4-5"
    CLASSIFICATION_MODEL: str = "claude-haiku-4-5"
    DEDUPLICATION_MODEL: str = "claude-haiku-4-5"
    ARTICLE_MODEL: str = "claude-opus-4-5"

    # Discord
    DISCORD_WEBHOOK_URL: str = os.environ.get("DISCORD_WEBHOOK_URL", "")
    DISCORD_WEBHOOK_URL_PREORDERS: str = os.environ.get("DISCORD_WEBHOOK_URL_PREORDERS", "")
    DISCORD_WEBHOOK_URL_RUMORS: str = os.environ.get("DISCORD_WEBHOOK_URL_RUMORS", "")

    # Scraper
    MAX_HTML_SIZE: int = 500_000  # 500KB
    FETCH_TIMEOUT: int = 30  # seconds
    FETCH_DELAY: float = 2.0  # polite delay between requests
    MAX_CANDIDATES_FOR_DEDUP: int = 20

    # Logging
    LOG_LEVEL: str = os.environ.get("LOG_LEVEL", "INFO")

    # Dry run (don't write to DB or send notifications)
    DRY_RUN: bool = os.environ.get("DRY_RUN", "false").lower() == "true"

    # Priority-based intervals (seconds)
    PRIORITY_INTERVALS = {
        1: 900,     # 15 minutes
        2: 3600,    # 1 hour
        3: 14400,   # 4 hours
        4: 86400,   # 24 hours
    }

    @classmethod
    def validate(cls) -> None:
        """Raise if required config is missing."""
        required = {
            "SUPABASE_URL": cls.SUPABASE_URL,
            "SUPABASE_SERVICE_ROLE_KEY": cls.SUPABASE_SERVICE_ROLE_KEY,
            "ANTHROPIC_API_KEY": cls.ANTHROPIC_API_KEY,
        }
        missing = [k for k, v in required.items() if not v]
        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")


config = Config()
