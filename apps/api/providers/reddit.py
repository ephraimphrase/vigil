"""
Raw Reddit API client (via PRAW) - "how to talk to Reddit" lives here,
separate from what ingestion/sentiment.py does with the response.
"""

import praw
from config import REDDIT_CLIENT_ID, REDDIT_SECRET

_client = praw.Reddit(
    client_id=REDDIT_CLIENT_ID,
    client_secret=REDDIT_SECRET,
    user_agent="vigil-health-monitor/1.0"
) if REDDIT_CLIENT_ID and REDDIT_SECRET else None


def is_configured() -> bool:
    return _client is not None


def search_subreddit(sub_name: str, query: str, time_filter: str = "week", limit: int = 15, sort: str = "new") -> list[dict]:
    """
    Searches a subreddit for `query` - each result has title, selftext,
    score (upvotes). Raises if REDDIT_CLIENT_ID/REDDIT_SECRET aren't set;
    callers that want to treat "not configured" as an empty result rather
    than an error should check is_configured() themselves before calling.
    """
    if not _client:
        raise RuntimeError("Reddit credentials not configured")

    sub = _client.subreddit(sub_name)
    return [
        {"title": post.title, "selftext": post.selftext, "score": post.score}
        for post in sub.search(query, time_filter=time_filter, limit=limit, sort=sort)
    ]
