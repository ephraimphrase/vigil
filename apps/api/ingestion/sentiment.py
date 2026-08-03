from db.models import Protocol, engine
from ingestion.base_fetcher import BaseFetcher
from providers import reddit
from sqlmodel import Session


def _get_protocol_subreddits(protocol_id: str) -> list[str]:
    """Returns the subreddits `protocol_id` searches for mentions. Falls
    back to just ["defi"] when untracked - that already covers general
    DeFi discussion for protocols without a dedicated subreddit."""
    with Session(engine) as session:
        protocol = session.get(Protocol, protocol_id)
        if not protocol or not protocol.sentiment_subreddits:
            return ["defi"]
        return protocol.sentiment_subreddits


class SentimentFetcher(BaseFetcher):
    """Ingestion only - raw post samples and engagement counts. Scoring
    what those posts mean (sentiment, risk keywords) is scoring's job, not
    this fetcher's; see scoring/ for that."""

    key = "sentiment"
    channel = "offchain"

    async def _fetch_payload(self, protocol_id: str) -> dict:
        if not reddit.is_configured():
            return {}

        subreddits = _get_protocol_subreddits(protocol_id)
        posts = []

        for sub_name in subreddits:
            try:
                posts.extend(reddit.search_subreddit(sub_name, protocol_id))
            except Exception as e:
                print(f"[WARN] Reddit fetch failed for {sub_name}: {e}")
                continue

        if not posts:
            return {}

        samples = []
        for p in posts[:10]:
            snippet = p["title"]
            if p["selftext"]:
                snippet += ". " + p["selftext"][:150]
            samples.append(snippet)

        avg_upvotes = sum(p["score"] for p in posts) / len(posts) if posts else 0
        return {
            "post_count_7d":  len(posts),
            "avg_upvotes":    avg_upvotes,
            "post_samples":   samples,
        }
