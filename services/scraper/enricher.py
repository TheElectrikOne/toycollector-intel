"""Enrich extracted product data with source metadata and confidence labels."""

from typing import Optional


def enrich_product(
    product: dict,
    classification: dict,
    normalized_dates: list[dict],
    deduplication: dict,
    source: Optional[dict] = None,
) -> dict:
    """
    Attach source trust level, confidence labels, and other enrichment data
    to an extracted product record.
    """
    trust_level = (source or {}).get("trust_level", 3)
    source_type = (source or {}).get("source_type", "community")
    source_name = (source or {}).get("name", "Unknown")

    # Derive final confidence from classification + source trust
    confidence_label = _resolve_confidence(
        classification.get("confidence_label", "unverified"),
        trust_level,
    )

    # Pick primary release date from normalized dates
    primary_date = _pick_primary_date(normalized_dates)

    return {
        **product,
        "source_trust_level": trust_level,
        "source_type": source_type,
        "source_name": source_name,
        "post_type": classification.get("post_type", "reveal"),
        "confidence_label": confidence_label,
        "urgency": classification.get("urgency", "standard"),
        "audience_segments": classification.get("audience_segments", []),
        "requires_corroboration": classification.get("requires_corroboration", trust_level < 3),
        "classification_reasoning": classification.get("classification_reasoning", ""),
        "normalized_dates": normalized_dates,
        "primary_date": primary_date,
        "deduplication": deduplication,
    }


def _resolve_confidence(
    classified_confidence: str,
    trust_level: int,
) -> str:
    """
    Apply source trust level rules to finalize confidence label.
    Low-trust sources cannot be 'confirmed'.
    """
    if trust_level <= 2:
        # Retailer or low-trust: cap at retailer_placeholder
        if classified_confidence == "confirmed":
            return "retailer_placeholder"
        if classified_confidence == "estimated":
            return "retailer_placeholder"
        return classified_confidence

    if trust_level == 3:
        # Community: cap at estimated
        if classified_confidence == "confirmed":
            return "estimated"
        return classified_confidence

    # Trust 4-5: respect classification
    return classified_confidence


def _pick_primary_date(normalized_dates: list[dict]) -> Optional[dict]:
    """Return the most relevant (most specific, highest confidence) date entry."""
    if not normalized_dates:
        return None

    # Prefer exact dates, then windows, then labels
    for d in normalized_dates:
        if d.get("date_exact"):
            return d

    for d in normalized_dates:
        if d.get("date_window_start"):
            return d

    return normalized_dates[0] if normalized_dates else None
