"""Claude API date normalization for toy release dates."""

import json
from datetime import date
import anthropic
from config import config
from loguru import logger
from extractor import _parse_json


DATE_NORMALIZATION_SYSTEM_PROMPT = """You are a date normalization engine for toy release dates. Given a list of raw date strings extracted from product pages, return normalized date data for each.

For each date string return:
{
  "raw": string,
  "date_exact": "YYYY-MM-DD" | null,
  "date_window_start": "YYYY-MM-DD" | null,
  "date_window_end": "YYYY-MM-DD" | null,
  "date_label": string | null,
  "confidence": "confirmed" | "estimated" | "retailer_placeholder" | "unverified",
  "normalization_notes": string
}

Rules:
- "Q1 2026" → window_start: 2026-01-01, window_end: 2026-03-31, label: "Q1 2026"
- "Spring 2026" → window_start: 2026-03-01, window_end: 2026-05-31, label: "Spring 2026"
- "Holiday 2025" → window_start: 2025-11-01, window_end: 2025-12-31, label: "Holiday 2025"
- If retailer uses a specific date without brand confirmation, mark confidence as "retailer_placeholder"
- Never return a date_exact unless the source explicitly states a specific day

Return a JSON array of normalized date objects."""


def normalize_dates(date_strings: list[str], trust_level: int) -> list[dict]:
    """
    Use Claude to normalize a list of raw date strings.
    Returns list of normalized date dicts.
    """
    if not date_strings:
        return []

    client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
    current_date = date.today().strftime("%Y-%m-%d")

    prompt = f"""INPUT DATE STRINGS: {json.dumps(date_strings)}
CURRENT DATE: {current_date}
SOURCE TRUST LEVEL: {trust_level}"""

    try:
        response = client.messages.create(
            model=config.CLASSIFICATION_MODEL,
            max_tokens=2048,
            temperature=0,
            system=DATE_NORMALIZATION_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": prompt}],
        )

        text = response.content[0].text
        parsed = _parse_json(text)

        if not isinstance(parsed, list):
            return []

        return parsed

    except Exception as e:
        logger.error(f"Date normalization failed: {e}")
        return [
            {
                "raw": ds,
                "date_exact": None,
                "date_window_start": None,
                "date_window_end": None,
                "date_label": ds,
                "confidence": "unverified",
                "normalization_notes": f"Normalization failed: {e}",
            }
            for ds in date_strings
        ]
