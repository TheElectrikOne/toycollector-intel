"""Configuration for the ToyCollector scraper service."""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Supabase
    SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "")

    # Kimi API (Moonshot AI — OpenAI-compatible)
    KIMI_API_KEY: str = os.environ.get("KIMI_API_KEY", "")
    KIMI_BASE_URL: str = os.environ.get("KIMI_BASE_URL", "https://api.moonshot.cn/v1")

    # Model IDs — verify exact names in your Kimi API dashboard
    # Common values: "kimi-k2", "moonshot-v1-128k", "kimi-latest"
    EXTRACTION_MODEL: str = os.environ.get("KIMI_MODEL", "kimi-k2")
    CLASSIFICATION_MODEL: str = os.environ.get("KIMI_MODEL", "kimi-k2")
    DEDUPLICATION_MODEL: str = os.environ.get("KIMI_MODEL", "kimi-k2")
    ARTICLE_MODEL: str = os.environ.get("KIMI_MODEL", "kimi-k2")

    # Discord
    DISCORD_WEBHOOK_URL: str = os.environ.get("DISCORD_WEBHOOK_URL", "")
    DISCORD_WEBHOOK_URL_PREORDERS: str = os.environ.get("DISCORD_WEBHOOK_URL_PREORDERS", "")
    DISCORD_WEBHOOK_URL_RUMORS: str = os.environ.get("DISCORD_WEBHOOK_URL_RUMORS", "")

    # Scraper
    MAX_HTML_SIZE: int = 500_000  # 500KB
    FETCH_TIMEOUT: int = 30  # seconds
    FETCH_DELAY: float = 2.0  # polite delay between requests
    MAX_CANDIDATES_FOR_DEDUP: int = 20

    # Auto-publish: detections from sources at or above this trust level
    # are published immediately without manual review.
    # Set to 6 to disable auto-publish (no source reaches 6).
    AUTO_PUBLISH_MIN_TRUST_LEVEL: int = int(os.environ.get("AUTO_PUBLISH_MIN_TRUST_LEVEL", "5"))

    # URL of the deployed Next.js web app — used to call the auto-publish API
    WEB_APP_URL: str = os.environ.get("WEB_APP_URL", "")

    # Admin secret — must match ADMIN_SECRET in the Next.js app
    ADMIN_SECRET: str = os.environ.get("ADMIN_SECRET", "")

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
            "KIMI_API_KEY": cls.KIMI_API_KEY,
        }
        missing = [k for k, v in required.items() if not v]
        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")


config = Config()
