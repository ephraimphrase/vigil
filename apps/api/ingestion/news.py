from datetime import datetime, timedelta
from config import NEWS_API_KEY
from providers import newsapi
from ingestion.base_fetcher import BaseFetcher

# In-memory cache: protocol -> {data: dict, timestamp: datetime}
_news_cache: dict[str, dict] = {}
_CACHE_TTL_SECONDS = 7200  # 2 hours


class NewsFetcher(BaseFetcher):
    """Ingestion only - raw headlines and article count. Classifying
    sentiment/key risk from those headlines is scoring's job, not this
    fetcher's; see scoring/ for that."""

    key = "news"
    channel = "offchain"

    async def _fetch_payload(self, protocol_id: str) -> dict:
        cached = _news_cache.get(protocol_id)
        if cached and (datetime.utcnow() - cached["timestamp"]).total_seconds() < _CACHE_TTL_SECONDS:
            return cached["data"]

        from_date = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")
        articles = []
        source = "newsapi"

        if NEWS_API_KEY:
            try:
                query = f'"{protocol_id}" DeFi OR "decentralized finance"'
                articles = await newsapi.get_everything(query, from_date)
            except Exception as e:
                print(f"[WARN] NewsAPI fetch failed for {protocol_id}: {e}")

        if not articles:
            # Fallback to Google News RSS (no API key needed) - same dict
            # shape as get_everything()'s articles, so the headline-building
            # below doesn't care which source actually answered.
            source = "google_news_rss"
            articles = await newsapi.get_google_news_rss(f"{protocol_id} DeFi")

        if not articles:
            result = {"article_count_7d": 0, "headlines": []}
            _news_cache[protocol_id] = {"data": result, "timestamp": datetime.utcnow()}
            return result

        headlines = []
        for a in articles[:12]:
            title = a.get("title") or ""
            desc  = (a.get("description") or "")[:100]
            headlines.append(f"{title}. {desc}".strip())

        result = {
            "article_count_7d": len(articles),
            "headlines":         headlines,
            "source":            source,
        }
        _news_cache[protocol_id] = {"data": result, "timestamp": datetime.utcnow()}
        return result
