import httpx
import anthropic
import json
import feedparser
from datetime import datetime, timedelta
from config import NEWS_API_KEY, ANTHROPIC_API_KEY

claude = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
NEWS_BASE = "https://newsapi.org/v2/everything"

_news_cache: dict[str, dict] = {}

async def fetch_news_signals(protocol: str) -> dict:
    cached = _news_cache.get(protocol)
    if cached and (datetime.utcnow() - cached["timestamp"]).seconds < 7200:
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
                articles = r.json().get("articles", []) if r.status_code == 200 else []
            except Exception:
                articles = []
                
    if not articles:
        # Fallback to Google News RSS
        articles = await fetch_google_news_rss(protocol)

    if not articles:
        result = {"news_sentiment": 0.5, "article_count_7d": 0, "key_risk": None}
        _news_cache[protocol] = {"data": result, "timestamp": datetime.utcnow()}
        return result

    headlines = []
    for a in articles[:12]:
        if isinstance(a, dict):
            headline = f"{a.get('title', '')}. {a.get('description', '')[:100]}"
            headlines.append(headline)
        else:
            headlines.append(a) # from RSS

    sentiment_data = await _classify_news_with_claude(headlines, protocol)

    result = {
        "news_sentiment":   sentiment_data.get("sentiment", 0.5),
        "article_count_7d": len(articles),
        "key_risk":         sentiment_data.get("key_risk")
    }
    
    _news_cache[protocol] = {"data": result, "timestamp": datetime.utcnow()}
    return result

async def fetch_google_news_rss(protocol: str) -> list[str]:
    query = f"{protocol} DeFi".replace(" ", "+")
    url = f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"
    feed = feedparser.parse(url)
    return [entry.title for entry in feed.entries[:10]]

async def _classify_news_with_claude(headlines: list[str], protocol: str) -> dict:
    if not ANTHROPIC_API_KEY:
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
        response = claude.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=100,
            messages=[{"role": "user", "content": prompt}]
        )
        return json.loads(response.content[0].text)
    except Exception:
        return {"sentiment": 0.5, "key_risk": None}
