"""
Auto-publisher: calls the Next.js auto-publish API for high-trust detections.

For sources at or above AUTO_PUBLISH_MIN_TRUST_LEVEL (default 5), this
bypasses the manual review queue and publishes immediately to the website.

Trust level 5 (official brand) → auto-publish
Trust level 4 (major press)   → queue for review (recommended)
Trust level ≤ 3                → queue for review

To change the threshold, set AUTO_PUBLISH_MIN_TRUST_LEVEL in the scraper .env.
Set it to 6 to disable auto-publish entirely.
"""

import httpx
from loguru import logger
from config import config


async def maybe_auto_publish(detection_id: str, trust_level: int) -> bool:
    """
    If trust_level meets the auto-publish threshold, call the web app
    to generate and publish the article immediately.

    Returns True if auto-published, False if queued for manual review.
    """
    if trust_level < config.AUTO_PUBLISH_MIN_TRUST_LEVEL:
        logger.info(
            f"Detection {detection_id} queued for review "
            f"(trust {trust_level} < threshold {config.AUTO_PUBLISH_MIN_TRUST_LEVEL})"
        )
        return False

    if not config.WEB_APP_URL:
        logger.warning(
            "WEB_APP_URL not set — cannot auto-publish. "
            "Detection will remain in review queue."
        )
        return False

    if not config.ADMIN_SECRET:
        logger.warning(
            "ADMIN_SECRET not set — cannot auto-publish. "
            "Detection will remain in review queue."
        )
        return False

    if config.DRY_RUN:
        logger.info(f"DRY RUN: would auto-publish detection {detection_id}")
        return False

    url = f"{config.WEB_APP_URL.rstrip('/')}/api/scraper/auto-publish"

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                url,
                json={"detection_id": detection_id},
                headers={
                    "Authorization": f"Bearer {config.ADMIN_SECRET}",
                    "Content-Type": "application/json",
                },
            )

        if response.status_code == 200:
            data = response.json()
            post_url = data.get("post_url", "")
            logger.info(
                f"Auto-published detection {detection_id} → {post_url}"
            )
            return True

        elif response.status_code == 403:
            # Trust threshold not met (double-check on web app side)
            logger.info(
                f"Detection {detection_id} not auto-published: "
                f"{response.json().get('error', 'threshold not met')}"
            )
            return False

        else:
            logger.error(
                f"Auto-publish failed for {detection_id}: "
                f"HTTP {response.status_code} — {response.text[:200]}"
            )
            return False

    except httpx.TimeoutException:
        logger.error(f"Auto-publish timeout for detection {detection_id}")
        return False
    except Exception as e:
        logger.error(f"Auto-publish error for detection {detection_id}: {e}")
        return False
