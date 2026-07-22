import praw
import anthropic
import json
from config import REDDIT_CLIENT_ID, REDDIT_SECRET, ANTHROPIC_API_KEY

reddit = praw.Reddit(
    client_id=REDDIT_CLIENT_ID,
    client_secret=REDDIT_SECRET,
    user_agent="vigil-health-monitor/1.0"
) if REDDIT_CLIENT_ID else None

claude = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

PROTOCOL_SUBREDDITS = {
    "aave":     ["Aave", "defi"],
    "compound": ["compound_finance", "defi"],
    "uniswap":  ["Uniswap", "defi"],
    "curve":    ["defi"],
    "makerdao": ["MakerDAO", "defi"],
    "lido":     ["defi"],
    "yearn":    ["defi"],
}

async def fetch_reddit_sentiment(protocol: str) -> dict:
    if not reddit:
        return {"sentiment_score": 0.5, "post_count_7d": 0, "avg_upvotes": 0, "risk_keywords": []}

    subreddits = PROTOCOL_SUBREDDITS.get(protocol, ["defi"])
    posts = []

    for sub_name in subreddits:
        try:
            sub = reddit.subreddit(sub_name)
            results = list(sub.search(protocol, time_filter="week", limit=15, sort="new"))
            posts.extend(results)
        except Exception as e:
            print(f"[WARN] Reddit fetch failed for {sub_name}: {e}")
            continue

    if not posts:
        return {"sentiment_score": 0.5, "post_count_7d": 0, "avg_upvotes": 0, "risk_keywords": []}

    samples = []
    for p in posts[:10]:
        snippet = p.title
        if p.selftext:
            snippet += ". " + p.selftext[:150]
        samples.append(snippet)

    sentiment_data = await _score_sentiment_with_claude(samples, protocol)

    return {
        "sentiment_score": sentiment_data.get("sentiment", 0.5),
        "post_count_7d":   len(posts),
        "avg_upvotes":     sum(p.score for p in posts) / len(posts) if posts else 0,
        "risk_keywords":   sentiment_data.get("keywords", [])
    }

async def _score_sentiment_with_claude(texts: list[str], protocol: str) -> dict:
    if not ANTHROPIC_API_KEY:
        return {"sentiment": 0.5, "keywords": []}

    joined = "\n".join(f"- {t}" for t in texts)
    prompt = f"""You are analyzing community sentiment about the {protocol} DeFi protocol.

Here are recent posts and discussions from the past 7 days:
{joined}

Return ONLY valid JSON with no other text:
{{"sentiment": <float 0.0-1.0>, "keywords": ["word1", "word2"]}}

Where:
0.0 = extreme panic, FUD, exploit fears, or mass exodus
0.5 = neutral, mixed, or low activity
1.0 = extremely positive, strong community confidence

Keywords: Extract 2-3 single-word indicators of risk (e.g. "exploit", "rug", "paused", "panic"). Empty list if no risk found.
"""

    try:
        response = claude.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=150,
            messages=[{"role": "user", "content": prompt}]
        )
        result = json.loads(response.content[0].text)
        return result
    except Exception:
        return {"sentiment": 0.5, "keywords": []}
