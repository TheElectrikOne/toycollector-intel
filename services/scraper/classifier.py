"""Kimi API classification of toy product records."""

import json
from openai import OpenAI
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
    Use Kimi to classify a toy product record.
    Returns classification dict.
    """
    client = OpenAI(api_key=config.KIMI_API_KEY, base_url=config.KIMI_BASE_URL)

    prompt = f"""INPUT:
{json.dumps(product, indent=2)}

Source trust level: {trust_level}
Source type: {source_type}"""

    try:
        response = client.chat.completions.create(
            model=config.CLASSIFICATION_MODEL,
            max_tokens=1024,
            temperature=0,
            messages=[
                {"role": "system", "content": CLASSIFICATION_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
        )

        text = response.choices[0].message.content or ""
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
