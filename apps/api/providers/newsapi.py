"""
Raw news client - NewsAPI.org (structured, needs a key) with a Google
News RSS fallback (needs no key). "How to talk to these two sources"
lives here, separate from what news.py does with the results.
"""

import asyncio
import httpx
import feedparser
from config import NEWS_API_KEY

EVERYTHING_URL = "https://newsapi.org/v2/everything"


async def get_everything(query: str, from_date: str, page_size: int = 20) -> list[dict]:
    """
    NewsAPI.org's /v2/everything - each article has source, author, title,
    description, url, urlToImage, publishedAt, content. Raises if
    NEWS_API_KEY isn't set; callers that want "not configured" to mean
    "fall back to RSS" should check the key themselves first.
    """
    if not NEWS_API_KEY:
        raise RuntimeError("NEWS_API_KEY not configured")

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(EVERYTHING_URL, params={
            "q":        query,
            "from":     from_date,
            "sortBy":   "relevancy",
            "pageSize": page_size,
            "apiKey":   NEWS_API_KEY,
            "language": "en",
        })
        if r.status_code != 200:
            raise RuntimeError(f"NewsAPI returned {r.status_code}")
        return r.json().get("articles", [])


async def get_google_news_rss(query: str, limit: int = 10) -> list[dict]:
    """
    Google News RSS fallback, no API key needed. Returns each entry's
    title, link, published date, source, and summary, normalized to the
    same dict shape callers already get from get_everything() so a caller
    doesn't need to know which source actually answered.
    feedparser.parse is blocking - runs in a thread pool executor.
    """
    url = f"https://news.google.com/rss/search?q={query.replace(' ', '+')}&hl=en-US&gl=US&ceid=US:en"
    loop = asyncio.get_event_loop()
    feed = await loop.run_in_executor(None, feedparser.parse, url)
    return [
        {
            "title": entry.get("title"),
            "description": entry.get("summary"),
            "url": entry.get("link"),
            "publishedAt": entry.get("published"),
            "source": {"name": entry.get("source", {}).get("title")} if entry.get("source") else None,
        }
        for entry in feed.entries[:limit]
    ]
