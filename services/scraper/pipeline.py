"""Full scraping pipeline orchestration."""

import asyncio
from dataclasses import dataclass, field
from typing import Optional
from loguru import logger

from config import config
import db
from fetcher import fetch_page, is_successful, FetchResult
from change_detection import detect_change
from extractor import extract_products
from classifier import classify_product
from date_normalizer import normalize_dates
from deduplicator import check_duplicate
from enricher import enrich_product
from social_poster import post_preorder_alert, post_rumor_alert
from auto_publisher import maybe_auto_publish


@dataclass
class PipelineResult:
    monitor_id: str
    url: str
    changed: bool = False
    products_extracted: int = 0
    detections_created: int = 0
    errors: list[str] = field(default_factory=list)
    skipped: bool = False
    skip_reason: str = ""


async def run_for_monitor(monitor: dict) -> PipelineResult:
    """
    Run the full pipeline for a single page monitor.

    Steps:
    1. Fetch page
    2. Detect change (SHA256 hash comparison)
    3. Store raw detection if changed
    4. Extract products using Claude
    5. Classify each product
    6. Normalize dates
    7. Deduplicate against existing products
    8. Enrich with source metadata
    9. Update DB with enriched data
    10. Send Discord alerts if applicable
    """
    monitor_id = monitor["id"]
    url = monitor["url"]
    source = monitor.get("sources") or {}  # Joined source row
    source_id = monitor.get("source_id")
    previous_hash = monitor.get("last_hash")
    monitor_type = monitor.get("monitor_type", "full_page")

    result = PipelineResult(monitor_id=monitor_id, url=url)

    # ── Step 1: Fetch ──────────────────────────────────────────────────────────
    use_playwright = monitor_type in ("full_page",) and source.get("trust_level", 3) >= 4
    fetch_result: FetchResult = await fetch_page(url, use_playwright=use_playwright)

    if not is_successful(fetch_result):
        error_msg = fetch_result.error or f"HTTP {fetch_result.status}"
        logger.warning(f"Fetch failed for {url}: {error_msg}")
        result.errors.append(f"Fetch failed: {error_msg}")
        db.update_monitor_check(monitor_id)
        return result

    # ── Step 2: Change detection ────────────────────────────────────────────────
    change = detect_change(fetch_result.html, previous_hash)
    db.update_monitor_check(
        monitor_id,
        new_hash=change.new_hash,
        changed=change.has_changed,
    )

    if not change.has_changed:
        result.skipped = True
        result.skip_reason = "No change detected"
        return result

    result.changed = True
    logger.info(f"Change detected at {url}")

    if config.DRY_RUN:
        logger.info(f"DRY RUN: would store detection for {url}")
        return result

    # ── Step 3: Store raw detection ─────────────────────────────────────────────
    detection = db.create_raw_detection(
        source_id=source_id,
        source_url=url,
        page_hash=change.new_hash,
        raw_html=fetch_result.html,
    )
    detection_id = detection.get("id")

    # ── Step 4: Extract ──────────────────────────────────────────────────────────
    extracted = extract_products(url, fetch_result.html)
    result.products_extracted = len(extracted)

    if not extracted:
        db.update_detection(detection_id, {
            "processing_status": "rejected",
            "notes": "No products extracted",
            "extracted_json": {"products": []},
        })
        return result

    trust_level = source.get("trust_level", 3)
    source_type = source.get("source_type", "community")

    # Load all products for deduplication
    all_products = db.get_all_products()

    enriched_products = []
    for product in extracted:
        try:
            # ── Step 5: Classify ─────────────────────────────────────────────
            classification = classify_product(product, trust_level, source_type)

            # ── Step 6: Normalize dates ──────────────────────────────────────
            raw_dates = product.get("raw_date_strings") or []
            normalized_dates = normalize_dates(raw_dates, trust_level) if raw_dates else []

            # ── Step 7: Deduplicate ──────────────────────────────────────────
            deduplication = check_duplicate(product, all_products)

            # ── Step 8: Enrich ───────────────────────────────────────────────
            enriched = enrich_product(
                product=product,
                classification=classification,
                normalized_dates=normalized_dates,
                deduplication=deduplication,
                source=source,
            )
            enriched_products.append(enriched)

            # ── Step 9: Discord alerts for high-urgency ──────────────────────
            urgency = enriched.get("urgency", "standard")
            post_type = enriched.get("post_type", "reveal")
            confidence = enriched.get("confidence_label", "unverified")

            if urgency in ("breaking", "high"):
                if post_type == "preorder_alert":
                    await post_preorder_alert(enriched, url)
                elif confidence == "unverified" and trust_level <= 2:
                    await post_rumor_alert(enriched, url)

            result.detections_created += 1

        except Exception as e:
            error_msg = f"Product processing error: {e}"
            logger.error(error_msg)
            result.errors.append(error_msg)

    # ── Step 9: Write enriched data back to detection ─────────────────────────
    all_skipped = all(
        e.get("deduplication", {}).get("recommended_action") == "skip"
        for e in enriched_products
    )
    status = "duplicate" if all_skipped else "extracted"

    db.update_detection(detection_id, {
        "processing_status": status,
        "extracted_json": {
            "products": enriched_products,
            "product": enriched_products[0] if enriched_products else {},
            "classification": enriched_products[0] if enriched_products else {},
            "source_trust_level": trust_level,
            "source_type": source_type,
        },
    })

    # ── Step 10: Auto-publish if trust threshold is met ───────────────────────
    if not all_skipped and detection_id:
        auto_published = await maybe_auto_publish(detection_id, trust_level)
        if auto_published:
            result.detections_created = len(enriched_products)
        else:
            logger.info(
                f"Detection {detection_id} placed in review queue "
                f"(trust level {trust_level})"
            )

    return result


async def run_pipeline(priority: Optional[int] = None) -> list[PipelineResult]:
    """
    Run the full pipeline for all monitors due for checking.
    Optionally filter by priority level.
    """
    due_monitors = db.get_monitors_due_for_check()

    if priority is not None:
        due_monitors = [m for m in due_monitors if m.get("priority") == priority]

    if not due_monitors:
        logger.info("No monitors due for check")
        return []

    logger.info(f"Running pipeline for {len(due_monitors)} monitors")

    results: list[PipelineResult] = []
    for monitor in due_monitors:
        logger.info(f"Processing monitor: {monitor.get('label') or monitor['url']}")
        try:
            result = await run_for_monitor(monitor)
            results.append(result)
            logger.info(
                f"Monitor {monitor['id']}: changed={result.changed}, "
                f"products={result.products_extracted}, "
                f"detections={result.detections_created}"
            )
        except Exception as e:
            logger.error(f"Pipeline error for monitor {monitor['id']}: {e}")
            results.append(PipelineResult(
                monitor_id=monitor["id"],
                url=monitor.get("url", ""),
                errors=[str(e)],
            ))

        # Polite delay between requests
        await asyncio.sleep(config.FETCH_DELAY)

    return results
