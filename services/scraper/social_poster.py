"""Discord webhook and social API posting for ToyIntel alerts."""

import httpx
from typing import Optional
from config import config
from loguru import logger


async def send_discord_message(webhook_url: str, message: str) -> bool:
    """Send a plain text message to a Discord webhook."""
    if not webhook_url:
        logger.debug("No Discord webhook URL configured, skipping")
        return False

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                webhook_url,
                json={"content": message, "username": "ToyIntel"},
                timeout=10,
            )
            response.raise_for_status()
            return True
    except Exception as e:
        logger.error(f"Discord message failed: {e}")
        return False


async def send_discord_embed(
    webhook_url: str,
    title: str,
    description: str,
    color: int = 0xF97316,
    fields: Optional[list[dict]] = None,
    footer_text: str = "ToyIntel",
    url: Optional[str] = None,
) -> bool:
    """Send a rich embed to a Discord webhook."""
    if not webhook_url:
        return False

    embed: dict = {
        "title": title,
        "description": description,
        "color": color,
        "footer": {"text": footer_text},
    }

    if fields:
        embed["fields"] = fields

    if url:
        embed["url"] = url

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                webhook_url,
                json={"embeds": [embed], "username": "ToyIntel"},
                timeout=10,
            )
            response.raise_for_status()
            return True
    except Exception as e:
        logger.error(f"Discord embed failed: {e}")
        return False


async def post_preorder_alert(enriched_product: dict, source_url: str) -> None:
    """Send a preorder alert to the preorders Discord channel."""
    webhook_url = config.DISCORD_WEBHOOK_URL_PREORDERS
    if not webhook_url:
        return

    product_name = enriched_product.get("product_name", "Unknown Product")
    brand = enriched_product.get("brand", "Unknown Brand")
    confidence = enriched_product.get("confidence_label", "unverified")
    source_name = enriched_product.get("source_name", "Unknown Source")

    # Color by confidence
    colors = {
        "confirmed": 0x22C55E,
        "estimated": 0xEAB308,
        "retailer_placeholder": 0x3B82F6,
        "unverified": 0xEF4444,
    }
    color = colors.get(confidence, 0xF97316)

    unconfirmed_note = " (retailer listing, unconfirmed)" if confidence == "retailer_placeholder" else ""

    description = f"**{product_name}** from **{brand}** has a new preorder listing{unconfirmed_note}."

    fields = [
        {"name": "Source", "value": f"[{source_name}]({source_url})", "inline": True},
        {"name": "Confidence", "value": confidence, "inline": True},
    ]

    price = enriched_product.get("msrp")
    if price:
        fields.append({"name": "Price", "value": f"${price}", "inline": True})

    await send_discord_embed(
        webhook_url,
        title=f"🛒 Preorder Alert: {product_name}",
        description=description,
        color=color,
        fields=fields,
    )


async def post_rumor_alert(enriched_product: dict, source_url: str) -> None:
    """Send a rumor alert to the rumors Discord channel."""
    webhook_url = config.DISCORD_WEBHOOK_URL_RUMORS
    if not webhook_url:
        return

    product_name = enriched_product.get("product_name", "Unknown Product")
    brand = enriched_product.get("brand", "Unknown Brand")
    source_name = enriched_product.get("source_name", "Unknown Source")

    description = (
        f"Unverified information about **{product_name}** from **{brand}** "
        f"via **{source_name}**. Not yet corroborated."
    )

    await send_discord_embed(
        webhook_url,
        title=f"⚠️ Rumor Watch: {product_name}",
        description=description,
        color=0xEF4444,
        fields=[{"name": "Source", "value": f"[{source_name}]({source_url})", "inline": True}],
    )


async def post_breaking_news(headline: str, summary: str, post_url: str, confidence: str) -> None:
    """Send a breaking news notification to the main Discord channel."""
    webhook_url = config.DISCORD_WEBHOOK_URL
    if not webhook_url:
        return

    colors = {
        "confirmed": 0x22C55E,
        "estimated": 0xEAB308,
        "retailer_placeholder": 0x3B82F6,
        "unverified": 0xEF4444,
    }
    color = colors.get(confidence, 0xF97316)

    await send_discord_embed(
        webhook_url,
        title=headline,
        description=summary,
        color=color,
        url=post_url,
        fields=[{"name": "Confidence", "value": confidence, "inline": True}],
    )
