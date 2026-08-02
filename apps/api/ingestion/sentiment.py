from config import REDDIT_CLIENT_ID, REDDIT_SECRET
from ingestion.base_fetcher import BaseFetcher
import praw

reddit = praw.Reddit(
    client_id=REDDIT_CLIENT_ID,
    client_secret=REDDIT_SECRET,
    user_agent="vigil-health-monitor/1.0"
) if REDDIT_CLIENT_ID and REDDIT_SECRET else None

PROTOCOL_SUBREDDITS = {
    "aave":     ["Aave", "defi"],
    "compound": ["compound_finance", "defi"],
    "uniswap":  ["Uniswap", "defi"],
    "curve":    ["defi"],
    "makerdao": ["MakerDAO", "defi"],
    "lido":     ["defi"],
    "yearn":    ["defi"],
}


class SentimentFetcher(BaseFetcher):
    """Ingestion only - raw post samples and engagement counts. Scoring
    what those posts mean (sentiment, risk keywords) is scoring's job, not
    this fetcher's; see scoring/ for that."""

    key = "sentiment"
    channel = "offchain"

    async def _fetch_payload(self, protocol_id: str) -> dict:
        if not reddit:
            return {}

        subreddits = PROTOCOL_SUBREDDITS.get(protocol_id, ["defi"])
        posts = []

        for sub_name in subreddits:
            try:
                sub = reddit.subreddit(sub_name)
                results = list(sub.search(protocol_id, time_filter="week", limit=15, sort="new"))
                posts.extend(results)
            except Exception as e:
                print(f"[WARN] Reddit fetch failed for {sub_name}: {e}")
                continue

        if not posts:
            return {}

        samples = []
        for p in posts[:10]:
            snippet = p.title
            if p.selftext:
                snippet += ". " + p.selftext[:150]
            samples.append(snippet)

        avg_upvotes = sum(p.score for p in posts) / len(posts) if posts else 0
        return {
            "post_count_7d":  len(posts),
            "avg_upvotes":    avg_upvotes,
            "post_samples":   samples,
        }
