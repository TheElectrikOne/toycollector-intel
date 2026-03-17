"""Claude API extraction calls — pulls structured product data from raw HTML."""

import json
from typing import Optional
import anthropic
from config import config
from loguru import logger


EXTRACTION_SYSTEM_PROMPT = """You are a toy product data extractor. Given the HTML content of a web page, extract all toy product information you can find and return it as structured JSON. Be conservative — only extract what is explicitly stated on the page. Do not infer dates or prices.

For each product found, return:
{
  "brand": string | null,
  "franchise": string | null,
  "line": string | null,
  "product_name": string,
  "character": string | null,
  "scale": string | null,
  "product_type": string | null,
  "preorder_date": string | null,
  "release_date": string | null,
  "release_window": string | null,
  "retailer": string | null,
  "exclusivity": string | null,
  "region": string | null,
  "msrp": string | null,
  "source_url": string,
  "raw_date_strings": [string],
  "extraction_notes": string
}

If a field is not present on the page, return null. Do not guess. If a date is ambiguous (e.g., "Fall 2025"), capture it in release_window and leave release_date null. Return an array of product objects."""


def get_client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)


def extract_products(url: str, html: str) -> list[dict]:
    """
    Use Claude to extract structured product data from raw HTML.
    Returns a list of product dicts.
    """
    client = get_client()
    truncated_html = html[:80_000] + "\n...[truncated]" if len(html) > 80_000 else html

    prompt = f"PAGE URL: {url}\nPAGE HTML: {truncated_html}"

    try:
        response = client.messages.create(
            model=config.EXTRACTION_MODEL,
            max_tokens=8192,
            temperature=0,
            system=EXTRACTION_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        text = response.content[0].text
        parsed = _parse_json(text)

        if not isinstance(parsed, list):
            logger.warning(f"Extraction returned non-list for {url}")
            return []

        return [p for p in parsed if isinstance(p, dict) and p.get("product_name")]

    except Exception as e:
        logger.error(f"Extraction failed for {url}: {e}")
        return []


def _parse_json(text: str) -> object:
    """Strip markdown fences and parse JSON."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
        cleaned = cleaned.rsplit("```", 1)[0].strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.error(f"JSON parse error: {e}\nRaw: {text[:500]}")
        return []
