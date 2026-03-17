"""SHA256-based page change detection."""

import hashlib
import re
from dataclasses import dataclass
from typing import Optional


@dataclass
class ChangeResult:
    has_changed: bool
    new_hash: str
    previous_hash: Optional[str]


def compute_hash(content: str) -> str:
    """Compute SHA256 hash of a string."""
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def normalize_html(html: str) -> str:
    """
    Normalize HTML to reduce false positives from dynamic content.
    Strips things that change on every page load.
    """
    # Remove HTML comments
    text = re.sub(r"<!--.*?-->", "", html, flags=re.DOTALL)
    # Remove script tags
    text = re.sub(r"<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>", "", text, flags=re.IGNORECASE | re.DOTALL)
    # Remove style tags
    text = re.sub(r"<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>", "", text, flags=re.IGNORECASE | re.DOTALL)
    # Remove CSRF tokens, nonces
    text = re.sub(r'\b(nonce|csrf[_-]?token|__cf_chl_tk)=["\'\w-]+["\']', "", text, flags=re.IGNORECASE)
    # Remove Unix timestamps (10-13 digit numbers)
    text = re.sub(r"\b\d{10,13}\b", "", text)
    # Normalize whitespace
    text = re.sub(r"\s+", " ", text).strip().lower()
    return text


def detect_change(html: str, previous_hash: Optional[str]) -> ChangeResult:
    """
    Detect if the page has meaningfully changed.
    Uses normalized hash to avoid false positives.
    """
    normalized = normalize_html(html)
    new_hash = compute_hash(normalized)
    has_changed = previous_hash is None or new_hash != previous_hash

    return ChangeResult(
        has_changed=has_changed,
        new_hash=new_hash,
        previous_hash=previous_hash,
    )


def compute_raw_hash(html: str) -> str:
    """Compute hash of raw (unnormalized) HTML for storage."""
    return compute_hash(html)
