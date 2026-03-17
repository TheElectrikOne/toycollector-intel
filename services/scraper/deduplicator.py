"""Fuzzy deduplication logic for toy product records."""

import json
from typing import Optional
import anthropic
from fuzzywuzzy import fuzz
from config import config
from loguru import logger
from extractor import _parse_json


DEDUPLICATION_SYSTEM_PROMPT = """You are a toy product deduplication engine. Given a new product record and a list of candidate existing records, determine if the new record is a duplicate of any existing record.

Return:
{
  "is_duplicate": boolean,
  "duplicate_of_id": string | null,
  "confidence": "certain" | "probable" | "possible" | "no_match",
  "reasoning": string,
  "recommended_action": "skip" | "update_existing" | "create_new" | "manual_review"
}

Rules:
- Same product_name + brand + line at same scale = certain duplicate
- Same character + brand + line but slightly different name phrasing = probable duplicate
- Same franchise + similar name but different product line = possible duplicate
- If the new record has a higher-trust source with a different date than the existing, recommend update_existing and flag the date change"""


def fuzzy_filter_candidates(new_product: dict, all_products: list[dict]) -> list[dict]:
    """
    Use fuzzy string matching to pre-filter candidate duplicates before sending to Claude.
    Returns at most MAX_CANDIDATES_FOR_DEDUP candidates.
    """
    new_name = (new_product.get("product_name") or "").lower()
    new_brand = (new_product.get("brand") or "").lower()
    new_franchise = (new_product.get("franchise") or "").lower()

    scored: list[tuple[int, dict]] = []
    for product in all_products:
        p_name = (product.get("product_name") or "").lower()
        p_brand = (product.get("brand") or "").lower()
        p_franchise = (product.get("franchise") or "").lower()

        # Score based on brand + name similarity
        brand_score = fuzz.ratio(new_brand, p_brand)
        name_score = fuzz.partial_ratio(new_name, p_name)
        franchise_score = fuzz.ratio(new_franchise, p_franchise) if new_franchise and p_franchise else 0

        composite = (brand_score * 0.3) + (name_score * 0.5) + (franchise_score * 0.2)

        if composite > 30:  # Only include reasonably similar candidates
            scored.append((int(composite), product))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [p for _, p in scored[:config.MAX_CANDIDATES_FOR_DEDUP]]


def check_duplicate(new_product: dict, all_products: list[dict]) -> dict:
    """
    Check if new_product is a duplicate of any existing product.
    Uses fuzzy pre-filter + Claude for final decision.
    """
    candidates = fuzzy_filter_candidates(new_product, all_products)

    if not candidates:
        return {
            "is_duplicate": False,
            "duplicate_of_id": None,
            "confidence": "no_match",
            "reasoning": "No fuzzy candidates found",
            "recommended_action": "create_new",
        }

    client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)

    prompt = f"""NEW RECORD:
{json.dumps(new_product, indent=2)}

CANDIDATE EXISTING RECORDS:
{json.dumps(candidates, indent=2)}"""

    try:
        response = client.messages.create(
            model=config.DEDUPLICATION_MODEL,
            max_tokens=1024,
            temperature=0,
            system=DEDUPLICATION_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        text = response.content[0].text
        return _parse_json(text)

    except Exception as e:
        logger.error(f"Deduplication failed: {e}")
        return {
            "is_duplicate": False,
            "duplicate_of_id": None,
            "confidence": "no_match",
            "reasoning": f"Dedup failed: {e}",
            "recommended_action": "manual_review",
        }
