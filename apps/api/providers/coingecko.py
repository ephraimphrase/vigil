"""
Raw CoinGecko API client - "how to talk to CoinGecko" lives here, separate
from what any given fetcher does with the response. Uses the free/Demo
tier (api.coingecko.com) - COINGECKO_API_KEY is optional, public endpoints
still work keyless at a lower, shared rate limit if it's unset.
"""

import httpx
from config import COINGECKO_API_KEY

BASE_URL = "https://api.coingecko.com/api/v3"


def _headers() -> dict:
    return {"x-cg-demo-api-key": COINGECKO_API_KEY} if COINGECKO_API_KEY else {}


async def get_coin(
    coin_id: str, *, community_data: bool = False, developer_data: bool = False
) -> dict:
    """
    Full /coins/{id} payload - description, links, and market_data
    (current price, market cap, fdv, ATH/ATL, 24h/7d/30d/1y price change,
    circulating/total/max supply, and more) always included. `coin_id` is
    CoinGecko's own slug (e.g. "aave"), not a ticker symbol.

    community_data/developer_data default off (market.py's normal call
    doesn't need either, and both add payload size/latency for nothing)
    - social.py and github.py opt in when using this as their
    LunarCrush/GitHub-API fallback; see extract_community_metadata and
    extract_developer_metadata.
    """
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            f"{BASE_URL}/coins/{coin_id}",
            params={
                "localization": "false",
                "tickers": "false",
                "market_data": "true",
                "community_data": "true" if community_data else "false",
                "developer_data": "true" if developer_data else "false",
            },
            headers=_headers(),
        )
        if r.status_code != 200:
            raise RuntimeError(f"CoinGecko API returned {r.status_code}")
        return r.json()


async def get_simple_price(coin_id: str) -> dict:
    """
    Lightweight /simple/price — current USD price, market cap, 24h volume,
    24h change only. Much smaller than get_coin(), for frequent polling
    where the full payload isn't needed.
    """
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            f"{BASE_URL}/simple/price",
            params={
                "ids": coin_id,
                "vs_currencies": "usd",
                "include_market_cap": "true",
                "include_24hr_vol": "true",
                "include_24hr_change": "true",
            },
            headers=_headers(),
        )
        if r.status_code != 200:
            raise RuntimeError(f"CoinGecko API returned {r.status_code}")
        return r.json().get(coin_id, {})


# Every scalar/simple field worth surfacing from a get_coin() payload's
# market_data block. Most of these are USD-denominated dicts keyed by
# currency (e.g. {"usd": 123.4, "eur": ...}) - see _usd() below.
_MARKET_DATA_KEYS = (
    "current_price", "market_cap", "fully_diluted_valuation", "total_volume",
    "high_24h", "low_24h",
    "price_change_percentage_24h", "price_change_percentage_7d",
    "price_change_percentage_14d", "price_change_percentage_30d",
    "price_change_percentage_1y",
    "market_cap_change_percentage_24h",
    "circulating_supply", "total_supply", "max_supply",
    "ath", "ath_change_percentage", "ath_date",
    "atl", "atl_change_percentage", "atl_date",
)


def extract_metadata(data: dict) -> dict:
    """Pulls every extractable scalar off a get_coin() payload's
    market_data (USD-denominated) - raw pass-through only, no
    interpretation (that's scoring's job)."""
    market_data = data.get("market_data", {}) or {}

    def usd(key: str):
        val = market_data.get(key)
        return val.get("usd") if isinstance(val, dict) else val

    metadata = {k: usd(k) for k in _MARKET_DATA_KEYS}
    metadata["name"] = data.get("name")
    metadata["symbol"] = data.get("symbol")
    metadata["market_cap_rank"] = data.get("market_cap_rank")
    return metadata


# Raw counts only - CoinGecko doesn't compute a sentiment score or
# LunarCrush-style galaxy/influence score, so there's no field here to
# rename into social.py's "sentiment_score"/"influence_score" without
# fabricating a number CoinGecko never gave us.
_COMMUNITY_DATA_KEYS = (
    "reddit_subscribers", "reddit_accounts_active_48h",
    "reddit_average_posts_48h", "reddit_average_comments_48h",
    "telegram_channel_user_count", "facebook_likes",
)


def extract_community_metadata(data: dict) -> dict:
    """Pulls every extractable scalar off a get_coin(community_data=True)
    payload's community_data - raw pass-through only. Fallback source for
    social.py when LunarCrush isn't configured/tracked or its call fails;
    several of these fields read 0 or null for most coins (CoinGecko's
    own social tracking is inconsistent), not necessarily a fetch bug."""
    community_data = data.get("community_data", {}) or {}
    return {k: community_data.get(k) for k in _COMMUNITY_DATA_KEYS}


# Same raw-pass-through approach as _COMMUNITY_DATA_KEYS - no scoring or
# reshaping into github.py's field names, since this is usually a single
# linked repo, not the full aggregated-across-the-org picture github.py
# builds from the real GitHub API.
_DEVELOPER_DATA_KEYS = (
    "forks", "stars", "subscribers", "total_issues", "closed_issues",
    "pull_requests_merged", "pull_request_contributors",
    "commit_count_4_weeks",
)


def extract_developer_metadata(data: dict) -> dict:
    """Pulls every extractable scalar off a get_coin(developer_data=True)
    payload's developer_data - raw pass-through only. Fallback source for
    github.py when a protocol has no github_repo tracked or the GitHub
    API call fails; coarser than github.py's real result (CoinGecko
    tracks one linked repo per coin, not every repo in the protocol's
    org)."""
    developer_data = data.get("developer_data", {}) or {}
    return {k: developer_data.get(k) for k in _DEVELOPER_DATA_KEYS}
