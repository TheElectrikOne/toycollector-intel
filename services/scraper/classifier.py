"""Claude API classification of toy product records."""

import json
from typing import Optional
import anthropic
from config import config
from loguru import logger
from extractor import _parse_json


CLASSIFICATION_SYSTEM_PROMPT = """You are a toy news classifier. Given a toy product record, classify it along the following dimensions. Return JSON only.

Return:
{
  "post_type": "reveal" | "preorder_alert" | "release_date_update" | "restock" | "cancellation" | "rumor" | "event",
  "confidence_label": "confirmed" | "estimated" | "retailer_placeholder" | "unverified",
  "urgency": "breaking" | "high" | "standard" | "low",
  "audience_segments": [string],
  "requires_corroboration": boolean,
  "classification_reasoning": string
}

Rules:
- If source is trust level 2 or below, confidence_label must be "retailer_placeholder" or "unverified"
- If source is trust level 5 and uses definitive date language, confidence_label is "confirmed"
- If source uses hedging language ("expected", "planned for", "tentative"), confidence_label is "estimated"
- requires_corroboration is true if trust_level < 3"""


def classify_product(product: dict, trust_level: int, source_type: str) -> dict:
    """
    Use Claude to classify a toy product record.
    Returns classification dict.
    """
    client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)

    prompt = f"""INPUT:
{json.dumps(product, indent=2)}

Source trust level: {trust_level}
Source type: {source_type}"""

    try:
        response = client.messages.create(
            model=config.CLASSIFICATION_MODEL,
            max_tokens=1024,
            temperature=0,
            system=CLASSIFICATION_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        text = response.content[0].text
        return _parse_json(text)

    except Exception as e:
        logger.error(f"Classification failed: {e}")
        return {
            "post_type": "reveal",
            "confidence_label": "unverified",
            "urgency": "low",
            "audience_segments": [],
            "requires_corroboration": True,
            "classification_reasoning": f"Classification failed: {e}",
        }
