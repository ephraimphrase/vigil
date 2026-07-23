import httpx
import json
import feedparser
from datetime import datetime, timedelta
from openai import AsyncOpenAI
from config import NEWS_API_KEY, OPENROUTER_API_KEY, OPENROUTER_MODEL

# Use AsyncOpenAI so news classification is non-blocking
llm_client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY
) if OPENROUTER_API_KEY else None

NEWS_BASE = "https://newsapi.org/v2/everything"

# In-memory cache: protocol -> {data: dict, timestamp: datetime}
_news_cache: dict[str, dict] = {}
_CACHE_TTL_SECONDS = 7200  # 2 hours


async def fetch_news_signals(protocol: str) -> dict:
    cached = _news_cache.get(protocol)
    if cached and (datetime.utcnow() - cached["timestamp"]).total_seconds() < _CACHE_TTL_SECONDS:
        return cached["data"]

    from_date = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")
    articles = []

    if NEWS_API_KEY:
        async with httpx.AsyncClient(timeout=10) as client:
            try:
                r = await client.get(NEWS_BASE, params={
                    "q":        f'"{protocol}" DeFi OR "decentralized finance"',
                    "from":     from_date,
                    "sortBy":   "relevancy",
                    "pageSize": 20,
                    "apiKey":   NEWS_API_KEY,
                    "language": "en",
                })
                if r.status_code == 200:
                    articles = r.json().get("articles", [])
            except Exception as e:
                print(f"[WARN] NewsAPI fetch failed for {protocol}: {e}")

    if not articles:
        # Fallback to Google News RSS (no API key needed)
        articles = await _fetch_google_news_rss(protocol)

    if not articles:
        result = {"news_sentiment": 0.5, "article_count_7d": 0, "key_risk": None}
        _news_cache[protocol] = {"data": result, "timestamp": datetime.utcnow()}
        return result

    headlines = []
    for a in articles[:12]:
        if isinstance(a, dict):
            title = a.get("title") or ""
            desc  = (a.get("description") or "")[:100]
            headlines.append(f"{title}. {desc}".strip())
        elif isinstance(a, str):
            headlines.append(a)

    sentiment_data = await _classify_news_with_llm(headlines, protocol)

    result = {
        "news_sentiment":   sentiment_data.get("sentiment", 0.5),
        "article_count_7d": len(articles),
        "key_risk":         sentiment_data.get("key_risk"),
    }
    _news_cache[protocol] = {"data": result, "timestamp": datetime.utcnow()}
    return result


async def _fetch_google_news_rss(protocol: str) -> list[str]:
    """Async-safe RSS fallback using feedparser (runs in thread pool to avoid blocking)."""
    import asyncio
    query = f"{protocol} DeFi".replace(" ", "+")
    url = f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"
    loop = asyncio.get_event_loop()
    # feedparser.parse is blocking — run in executor to avoid blocking the event loop
    feed = await loop.run_in_executor(None, feedparser.parse, url)
    return [entry.title for entry in feed.entries[:10]]


async def _classify_news_with_llm(headlines: list[str], protocol: str) -> dict:
    """Uses OpenRouter LLM to classify news sentiment and surface key risks."""
    if not llm_client:
        return {"sentiment": 0.5, "key_risk": None}

    joined = "\n".join(f"- {h}" for h in headlines)
    prompt = f"""Analyze these news headlines about the {protocol} DeFi protocol.

{joined}

Return ONLY valid JSON with no other text:
{{"sentiment": <float 0.0-1.0>, "key_risk": "<max 8 words or null>"}}

Where:
0.0 = major negative coverage (exploit, SEC action, team exit, insolvency risk)
0.5 = neutral or mixed coverage
1.0 = strongly positive coverage (partnerships, growth, audits passed)"""

    try:
        response = await llm_client.chat.completions.create(
            model=OPENROUTER_MODEL,
            max_tokens=100,
            messages=[{"role": "user", "content": prompt}]
        )
        return json.loads(response.choices[0].message.content)
    except Exception:
        return {"sentiment": 0.5, "key_risk": None}
