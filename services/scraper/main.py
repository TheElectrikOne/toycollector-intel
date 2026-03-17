"""
ToyCollector Scraper — Main entry point with APScheduler.

Schedule:
  Priority 1 monitors: every 15 minutes
  Priority 2 monitors: every 1 hour
  Priority 3 monitors: every 4 hours
  Priority 4 monitors: every 24 hours
"""

import asyncio
import sys
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from loguru import logger

from config import config
from pipeline import run_pipeline


def setup_logging() -> None:
    """Configure loguru logging."""
    logger.remove()  # Remove default handler
    logger.add(
        sys.stdout,
        level=config.LOG_LEVEL,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        colorize=True,
    )
    logger.add(
        "logs/scraper.log",
        level="DEBUG",
        rotation="100 MB",
        retention="7 days",
        compression="zip",
    )


async def run_priority_pipeline(priority: int) -> None:
    """Run pipeline for a specific priority level."""
    logger.info(f"Starting scheduled run for priority {priority} monitors")
    try:
        results = await run_pipeline(priority=priority)
        changed = sum(1 for r in results if r.changed)
        total_products = sum(r.products_extracted for r in results)
        total_errors = sum(len(r.errors) for r in results)
        logger.info(
            f"Priority {priority} run complete: {len(results)} monitors, "
            f"{changed} changed, {total_products} products extracted, "
            f"{total_errors} errors"
        )
    except Exception as e:
        logger.error(f"Priority {priority} pipeline failed: {e}")


async def run_full_pipeline() -> None:
    """Run pipeline for all due monitors (catch-all)."""
    logger.info("Starting full pipeline run")
    try:
        results = await run_pipeline()
        changed = sum(1 for r in results if r.changed)
        total_products = sum(r.products_extracted for r in results)
        logger.info(
            f"Full pipeline complete: {len(results)} monitors, "
            f"{changed} changed, {total_products} products extracted"
        )
    except Exception as e:
        logger.error(f"Full pipeline failed: {e}")


def create_scheduler() -> AsyncIOScheduler:
    """Create and configure the APScheduler instance."""
    scheduler = AsyncIOScheduler(timezone="UTC")

    # Priority 1: every 15 minutes
    scheduler.add_job(
        run_priority_pipeline,
        trigger=IntervalTrigger(minutes=15),
        args=[1],
        id="priority_1",
        name="Priority 1 Monitors (15min)",
        replace_existing=True,
        max_instances=1,
    )

    # Priority 2: every 1 hour
    scheduler.add_job(
        run_priority_pipeline,
        trigger=IntervalTrigger(hours=1),
        args=[2],
        id="priority_2",
        name="Priority 2 Monitors (1hr)",
        replace_existing=True,
        max_instances=1,
    )

    # Priority 3: every 4 hours
    scheduler.add_job(
        run_priority_pipeline,
        trigger=IntervalTrigger(hours=4),
        args=[3],
        id="priority_3",
        name="Priority 3 Monitors (4hr)",
        replace_existing=True,
        max_instances=1,
    )

    # Priority 4: every 24 hours at 6 AM UTC
    scheduler.add_job(
        run_priority_pipeline,
        trigger=CronTrigger(hour=6, minute=0),
        args=[4],
        id="priority_4",
        name="Priority 4 Monitors (daily)",
        replace_existing=True,
        max_instances=1,
    )

    return scheduler


async def main() -> None:
    """Main entry point."""
    setup_logging()
    logger.info("ToyCollector Scraper starting up")

    # Validate config
    try:
        config.validate()
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        sys.exit(1)

    if config.DRY_RUN:
        logger.warning("DRY RUN mode enabled — no writes to DB or notifications")

    # Run an immediate startup scan of all due monitors
    logger.info("Running initial pipeline scan on startup...")
    await run_full_pipeline()

    # Start scheduler
    scheduler = create_scheduler()
    scheduler.start()

    logger.info("Scheduler started. Running jobs:")
    for job in scheduler.get_jobs():
        logger.info(f"  - {job.name}: {job.trigger}")

    # Keep running
    try:
        while True:
            await asyncio.sleep(60)
    except (KeyboardInterrupt, SystemExit):
        logger.info("Shutting down scheduler...")
        scheduler.shutdown()
        logger.info("ToyCollector Scraper stopped")


if __name__ == "__main__":
    asyncio.run(main())
