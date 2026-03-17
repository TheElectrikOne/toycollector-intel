"""
Seed 25+ real toy sources and page monitors into the database.

Usage:
    python sources_seed.py

This script is idempotent — it uses upsert (on_conflict=url) so it can
be run multiple times safely.
"""

import asyncio
import sys
from loguru import logger
from config import config
import db


# ── Source Definitions ─────────────────────────────────────────────────────────

SOURCES = [
    # ─── Trust Level 5: Official Brand ──────────────────────────────────────
    {
        "name": "Hasbro Pulse",
        "url": "https://www.hasbropulse.com",
        "source_type": "official_brand",
        "trust_level": 5,
        "brand_affiliation": "Hasbro",
        "language": "en",
        "notes": "Hasbro's official DTC platform. Primary source for all Hasbro product reveals.",
        "active": True,
    },
    {
        "name": "Good Smile Official",
        "url": "https://www.goodsmile.info",
        "source_type": "official_brand",
        "trust_level": 5,
        "brand_affiliation": "Good Smile Company",
        "language": "en",
        "notes": "Good Smile Company official website. Source of record for Nendoroid and Figma.",
        "active": True,
    },
    {
        "name": "Bandai Hobby",
        "url": "https://p-bandai.com",
        "source_type": "official_brand",
        "trust_level": 5,
        "brand_affiliation": "Bandai",
        "language": "en",
        "notes": "Premium Bandai — official Bandai DTC store. Source for P-Bandai exclusives.",
        "active": True,
    },
    {
        "name": "NECA Online",
        "url": "https://www.necaonline.com",
        "source_type": "official_brand",
        "trust_level": 5,
        "brand_affiliation": "NECA",
        "language": "en",
        "notes": "NECA official site. All NECA reveals and release info.",
        "active": True,
    },
    {
        "name": "Sideshow Press",
        "url": "https://www.sideshowtoy.com/pressreleases",
        "source_type": "official_brand",
        "trust_level": 5,
        "brand_affiliation": "Sideshow",
        "language": "en",
        "notes": "Sideshow Collectibles official press releases. High-end statues and figures.",
        "active": True,
    },
    {
        "name": "Hot Toys Official",
        "url": "https://www.hottoys.com.hk",
        "source_type": "official_brand",
        "trust_level": 5,
        "brand_affiliation": "Hot Toys",
        "language": "en",
        "notes": "Hot Toys official website. 1/6 scale collectible figures.",
        "active": True,
    },
    {
        "name": "Mattel Shop",
        "url": "https://shop.mattel.com",
        "source_type": "official_brand",
        "trust_level": 5,
        "brand_affiliation": "Mattel",
        "language": "en",
        "notes": "Mattel official DTC store. Barbie, Hot Wheels, Masters of the Universe.",
        "active": True,
    },
    {
        "name": "McFarlane Toys",
        "url": "https://mcfarlane.com",
        "source_type": "official_brand",
        "trust_level": 5,
        "brand_affiliation": "McFarlane Toys",
        "language": "en",
        "notes": "McFarlane Toys official site. DC, Spawn, sports figures.",
        "active": True,
    },
    {
        "name": "Kotobukiya",
        "url": "https://en.kotobukiya.co.jp",
        "source_type": "official_brand",
        "trust_level": 5,
        "brand_affiliation": "Kotobukiya",
        "language": "en",
        "notes": "Kotobukiya English site. ARTFX, Bishoujo, model kits.",
        "active": True,
    },
    {
        "name": "Funko Blog",
        "url": "https://www.funko.com/blog",
        "source_type": "official_brand",
        "trust_level": 5,
        "brand_affiliation": "Funko",
        "language": "en",
        "notes": "Funko official blog. Pop figures and vinyl collectibles.",
        "active": True,
    },
    # ─── Trust Level 4: Industry Press ──────────────────────────────────────
    {
        "name": "Toy Insider",
        "url": "https://www.thetoyinsider.com",
        "source_type": "press",
        "trust_level": 4,
        "brand_affiliation": None,
        "language": "en",
        "notes": "Industry trade publication. Early access to manufacturer news.",
        "active": True,
    },
    {
        "name": "ICV2",
        "url": "https://icv2.com",
        "source_type": "press",
        "trust_level": 4,
        "brand_affiliation": None,
        "language": "en",
        "notes": "Comics & collectibles trade news. License deals, sales data.",
        "active": True,
    },
    {
        "name": "Bleeding Cool Toys",
        "url": "https://bleedingcool.com/toys",
        "source_type": "press",
        "trust_level": 4,
        "brand_affiliation": None,
        "language": "en",
        "notes": "Pop culture news with strong toy coverage. Has industry contacts.",
        "active": True,
    },
    {
        "name": "Action Figure Insider",
        "url": "https://www.actionfigureinsider.com",
        "source_type": "press",
        "trust_level": 4,
        "brand_affiliation": None,
        "language": "en",
        "notes": "Dedicated action figure news site with press access.",
        "active": True,
    },
    {
        "name": "CollectionDX",
        "url": "https://www.collectiondx.com",
        "source_type": "press",
        "trust_level": 4,
        "brand_affiliation": None,
        "language": "en",
        "notes": "Japanese toy and collectible focused review/news site.",
        "active": True,
    },
    # ─── Trust Level 3: Established Community ────────────────────────────────
    {
        "name": "The Fwoosh",
        "url": "https://thefwoosh.com",
        "source_type": "community",
        "trust_level": 3,
        "brand_affiliation": None,
        "language": "en",
        "notes": "Major collector community. Good for Marvel Legends, DC Multiverse leaks.",
        "active": True,
    },
    {
        "name": "Toyark",
        "url": "https://www.toyark.com",
        "source_type": "community",
        "trust_level": 3,
        "brand_affiliation": None,
        "language": "en",
        "notes": "Large toy news community. Wide coverage of major brands.",
        "active": True,
    },
    {
        "name": "HissTank",
        "url": "https://www.hisstank.com",
        "source_type": "community",
        "trust_level": 3,
        "brand_affiliation": None,
        "language": "en",
        "notes": "GI Joe dedicated community. Best source for Hasbro GI Joe info.",
        "active": True,
    },
    {
        "name": "TFW2005",
        "url": "https://www.tfw2005.com",
        "source_type": "community",
        "trust_level": 3,
        "brand_affiliation": "Transformers",
        "language": "en",
        "notes": "Premier Transformers fan community. Best for Transformers news.",
        "active": True,
    },
    {
        "name": "MWC Toys",
        "url": "https://www.mwctoys.com",
        "source_type": "community",
        "trust_level": 3,
        "brand_affiliation": None,
        "language": "en",
        "notes": "Toy collecting community with news coverage.",
        "active": True,
    },
    # ─── Trust Level 2: Retailer ─────────────────────────────────────────────
    {
        "name": "BigBadToyStore",
        "url": "https://www.bigbadtoystore.com",
        "source_type": "official_retailer",
        "trust_level": 2,
        "brand_affiliation": None,
        "language": "en",
        "notes": "Major specialty toy retailer. Listings may be early placeholder dates.",
        "active": True,
    },
    {
        "name": "Entertainment Earth",
        "url": "https://www.entertainmentearth.com",
        "source_type": "official_retailer",
        "trust_level": 2,
        "brand_affiliation": None,
        "language": "en",
        "notes": "Licensed collectibles retailer. Often lists products before official reveals.",
        "active": True,
    },
    {
        "name": "Sideshow Collectibles",
        "url": "https://www.sideshowtoy.com",
        "source_type": "official_retailer",
        "trust_level": 2,
        "brand_affiliation": None,
        "language": "en",
        "notes": "High-end collectibles retailer and manufacturer. Some in-house exclusives at T5.",
        "active": True,
    },
    {
        "name": "AmiAmi",
        "url": "https://www.amiami.com",
        "source_type": "official_retailer",
        "trust_level": 2,
        "brand_affiliation": None,
        "language": "en",
        "notes": "Japanese import hobby retailer. Good for figure preorder dates.",
        "active": True,
    },
    {
        "name": "Solaris Japan",
        "url": "https://solarisjapan.com",
        "source_type": "official_retailer",
        "trust_level": 2,
        "brand_affiliation": None,
        "language": "en",
        "notes": "Japanese collectibles importer. Useful for JP-exclusive figure dates.",
        "active": True,
    },
]


# ── Page Monitor Definitions ──────────────────────────────────────────────────
# These reference sources by name — we look up IDs after seeding sources.

PAGE_MONITORS = [
    {
        "source_name": "Hasbro Pulse",
        "url": "https://www.hasbropulse.com/collections/new-products",
        "label": "Hasbro Pulse — New Products",
        "monitor_type": "api",
        "check_interval": 900,   # 15 minutes
        "priority": 1,
        "is_active": True,
    },
    {
        "source_name": "BigBadToyStore",
        "url": "https://www.bigbadtoystore.com/New/This-Week",
        "label": "BBTS — New Arrivals This Week",
        "monitor_type": "full_page",
        "check_interval": 900,   # 15 minutes
        "priority": 1,
        "is_active": True,
    },
    {
        "source_name": "Good Smile Official",
        "url": "https://www.goodsmile.info/en/products/new/",
        "label": "Good Smile — New Products",
        "monitor_type": "full_page",
        "check_interval": 3600,  # 1 hour
        "priority": 2,
        "is_active": True,
    },
    {
        "source_name": "NECA Online",
        "url": "https://www.necaonline.com/new-items/",
        "label": "NECA — New Items",
        "monitor_type": "full_page",
        "check_interval": 3600,
        "priority": 2,
        "is_active": True,
    },
    {
        "source_name": "McFarlane Toys",
        "url": "https://mcfarlane.com/new/",
        "label": "McFarlane Toys — New Releases",
        "monitor_type": "full_page",
        "check_interval": 3600,
        "priority": 2,
        "is_active": True,
    },
    {
        "source_name": "The Fwoosh",
        "url": "https://thefwoosh.com/feed/",
        "label": "The Fwoosh — RSS Feed",
        "monitor_type": "rss",
        "check_interval": 14400,  # 4 hours
        "priority": 3,
        "is_active": True,
    },
    {
        "source_name": "Toyark",
        "url": "https://www.toyark.com/feed/",
        "label": "Toyark — RSS Feed",
        "monitor_type": "rss",
        "check_interval": 14400,
        "priority": 3,
        "is_active": True,
    },
    {
        "source_name": "TFW2005",
        "url": "https://www.tfw2005.com/boards/forums/transformers-news-and-rumors.8/index.rss",
        "label": "TFW2005 — News & Rumors Feed",
        "monitor_type": "rss",
        "check_interval": 14400,
        "priority": 3,
        "is_active": True,
    },
]


def seed_sources() -> dict[str, str]:
    """Seed all sources and return name → id mapping."""
    logger.info(f"Seeding {len(SOURCES)} sources...")
    source_ids: dict[str, str] = {}

    for source_data in SOURCES:
        try:
            result = db.upsert_source(source_data)
            source_id = result.get("id")
            if source_id:
                source_ids[source_data["name"]] = source_id
                logger.info(f"  ✓ {source_data['name']} (T{source_data['trust_level']}) → {source_id}")
            else:
                logger.warning(f"  ? No ID returned for {source_data['name']}")
        except Exception as e:
            logger.error(f"  ✗ Failed to seed {source_data['name']}: {e}")

    logger.info(f"Seeded {len(source_ids)} sources")
    return source_ids


def seed_monitors(source_ids: dict[str, str]) -> None:
    """Seed page monitors using source IDs from seed_sources()."""
    logger.info(f"Seeding {len(PAGE_MONITORS)} page monitors...")
    seeded = 0

    for monitor_data in PAGE_MONITORS:
        source_name = monitor_data.pop("source_name")
        source_id = source_ids.get(source_name)

        if not source_id:
            logger.warning(f"  ? No source ID found for '{source_name}', skipping monitor")
            continue

        try:
            result = db.upsert_page_monitor({
                **monitor_data,
                "source_id": source_id,
            })
            if result.get("id"):
                seeded += 1
                logger.info(f"  ✓ {monitor_data['label']}")
            else:
                logger.warning(f"  ? No ID for monitor {monitor_data.get('label')}")
        except Exception as e:
            logger.error(f"  ✗ Failed to seed monitor {monitor_data.get('label')}: {e}")

    logger.info(f"Seeded {seeded} page monitors")


def main() -> None:
    """Run the seed script."""
    from loguru import logger as log
    import sys

    log.remove()
    log.add(sys.stdout, level="INFO", format="{time:HH:mm:ss} | {level} | {message}")

    log.info("Starting ToyCollector source seeding...")

    try:
        config.validate()
    except ValueError as e:
        log.error(f"Config error: {e}")
        log.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables")
        sys.exit(1)

    source_ids = seed_sources()
    seed_monitors(source_ids)

    log.info("Seeding complete!")
    log.info(f"  Sources: {len(source_ids)}")
    log.info(f"  Monitors: {len(PAGE_MONITORS)}")


if __name__ == "__main__":
    main()
