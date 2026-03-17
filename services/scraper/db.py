"""Supabase database client for the scraper service."""

from typing import Any, Optional
from supabase import create_client, Client
from config import config
from loguru import logger


_client: Optional[Client] = None


def get_client() -> Client:
    """Get or create the Supabase client (singleton)."""
    global _client
    if _client is None:
        if not config.SUPABASE_URL or not config.SUPABASE_SERVICE_ROLE_KEY:
            raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
        _client = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)
    return _client


def get_active_monitors(priority: Optional[int] = None) -> list[dict]:
    """Fetch all active page_monitors, optionally filtered by priority."""
    client = get_client()
    query = client.table("page_monitors").select(
        "*, sources(id, name, url, source_type, trust_level, brand_affiliation)"
    ).eq("is_active", True)

    if priority is not None:
        query = query.eq("priority", priority)

    result = query.order("priority", desc=False).execute()
    return result.data or []


def get_monitors_due_for_check() -> list[dict]:
    """Return monitors where last_checked_at + check_interval <= now, or never checked."""
    from datetime import datetime, timezone, timedelta
    client = get_client()

    # Fetch all active monitors with source
    monitors = get_active_monitors()
    now = datetime.now(timezone.utc)

    due = []
    for m in monitors:
        if not m.get("last_checked_at"):
            due.append(m)
            continue
        last_checked = datetime.fromisoformat(m["last_checked_at"].replace("Z", "+00:00"))
        interval = m.get("check_interval") or 3600
        next_check = last_checked + timedelta(seconds=interval)
        if next_check <= now:
            due.append(m)

    return due


def update_monitor_check(
    monitor_id: str,
    new_hash: Optional[str] = None,
    changed: bool = False,
) -> None:
    """Update last_checked_at (and optionally last_changed_at + last_hash)."""
    from datetime import datetime, timezone
    client = get_client()
    now = datetime.now(timezone.utc).isoformat()

    updates: dict[str, Any] = {"last_checked_at": now}
    if changed and new_hash:
        updates["last_changed_at"] = now
        updates["last_hash"] = new_hash

    client.table("page_monitors").update(updates).eq("id", monitor_id).execute()


def create_raw_detection(
    source_id: Optional[str],
    source_url: str,
    page_hash: str,
    raw_html: str,
) -> dict:
    """Insert a new raw_detection row and return it."""
    from datetime import datetime, timezone
    client = get_client()

    row = {
        "source_id": source_id,
        "source_url": source_url,
        "page_hash": page_hash,
        "raw_html": raw_html[:config.MAX_HTML_SIZE],
        "processing_status": "pending",
        "detected_at": datetime.now(timezone.utc).isoformat(),
    }
    result = client.table("raw_detections").insert(row).execute()
    return result.data[0] if result.data else {}


def update_detection(detection_id: str, updates: dict) -> None:
    """Update a raw_detection row."""
    client = get_client()
    client.table("raw_detections").update(updates).eq("id", detection_id).execute()


def get_all_products(limit: int = 500) -> list[dict]:
    """Fetch all products for deduplication candidates."""
    client = get_client()
    result = (
        client.table("products")
        .select("id, brand, franchise, line, product_name, character, scale")
        .limit(limit)
        .execute()
    )
    return result.data or []


def create_product(product_data: dict) -> dict:
    """Insert a new product and return it."""
    client = get_client()
    result = client.table("products").insert(product_data).execute()
    return result.data[0] if result.data else {}


def create_release_date(release_data: dict) -> dict:
    """Insert a new release_date row."""
    client = get_client()
    result = client.table("release_dates").insert(release_data).execute()
    return result.data[0] if result.data else {}


def upsert_source(source_data: dict) -> dict:
    """Insert or update a source row."""
    client = get_client()
    result = client.table("sources").upsert(source_data, on_conflict="url").execute()
    return result.data[0] if result.data else {}


def upsert_page_monitor(monitor_data: dict) -> dict:
    """Insert or update a page_monitor row."""
    client = get_client()
    result = client.table("page_monitors").upsert(monitor_data, on_conflict="url").execute()
    return result.data[0] if result.data else {}
