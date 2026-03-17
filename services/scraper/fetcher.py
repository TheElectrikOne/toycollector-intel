"""HTTP fetcher with Playwright fallback for JS-heavy pages."""

import asyncio
from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime

import httpx
from loguru import logger
from config import config

DEFAULT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; ToyIntelBot/1.0; +https://toyintel.com/bot)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Cache-Control": "no-cache",
}


@dataclass
class FetchResult:
    url: str
    html: str
    status: int
    content_type: str
    fetched_at: datetime = field(default_factory=datetime.utcnow)
    error: Optional[str] = None
    used_playwright: bool = False


async def fetch_with_httpx(url: str) -> FetchResult:
    """Fetch a page using httpx (faster, no JS rendering)."""
    try:
        async with httpx.AsyncClient(
            headers=DEFAULT_HEADERS,
            timeout=config.FETCH_TIMEOUT,
            follow_redirects=True,
        ) as client:
            response = await client.get(url)
            return FetchResult(
                url=url,
                html=response.text,
                status=response.status_code,
                content_type=response.headers.get("content-type", ""),
            )
    except Exception as e:
        logger.warning(f"httpx fetch failed for {url}: {e}")
        return FetchResult(url=url, html="", status=0, content_type="", error=str(e))


async def fetch_with_playwright(url: str) -> FetchResult:
    """Fetch a page using Playwright (handles JS rendering)."""
    try:
        from playwright.async_api import async_playwright

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent=DEFAULT_HEADERS["User-Agent"],
                extra_http_headers={"Accept-Language": "en-US,en;q=0.5"},
            )
            page = await context.new_page()
            await page.goto(url, wait_until="networkidle", timeout=config.FETCH_TIMEOUT * 1000)
            html = await page.content()
            status = 200  # Playwright doesn't expose status easily after navigation
            await browser.close()

            return FetchResult(
                url=url,
                html=html,
                status=status,
                content_type="text/html",
                used_playwright=True,
            )
    except Exception as e:
        logger.warning(f"Playwright fetch failed for {url}: {e}")
        return FetchResult(
            url=url, html="", status=0, content_type="", error=str(e), used_playwright=True
        )


async def fetch_page(url: str, use_playwright: bool = False) -> FetchResult:
    """Fetch a page, using Playwright if requested or if httpx fails with JS hint."""
    if use_playwright:
        return await fetch_with_playwright(url)

    result = await fetch_with_httpx(url)

    # Fallback to Playwright if httpx returns nearly empty content
    if result.status == 200 and len(result.html) < 1000:
        logger.info(f"httpx returned small content for {url}, trying Playwright")
        pw_result = await fetch_with_playwright(url)
        if len(pw_result.html) > len(result.html):
            return pw_result

    return result


def is_successful(result: FetchResult) -> bool:
    return result.status >= 200 and result.status < 300 and not result.error and len(result.html) > 0


async def fetch_rss(url: str) -> FetchResult:
    """Fetch an RSS/Atom feed."""
    return await fetch_with_httpx(url)
