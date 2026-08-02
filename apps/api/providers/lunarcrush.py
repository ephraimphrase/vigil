"""
Raw LunarCrush API client - "how to talk to LunarCrush" lives here,
separate from what social.py does with the response.

Not live-verified: this environment has no LUNARCRUSH_KEY configured, so
field names below are per LunarCrush's v4 docs as of 2026-07-22, not
confirmed against a real response the way llama.py's were. Treat the
_METADATA_KEYS list as a starting point to double-check once a key is
available, not a guarantee.
"""

import httpx
from config import LUNARCRUSH_KEY

BASE_URL = "https://lunarcrush.com/api4/public/coins"


async def get_coin(symbol: str) -> dict:
    """
    Full /coins/{symbol}/v1 payload - price/market data plus social
    metrics (galaxy score, sentiment, social volume/dominance, alt rank,
    interactions) for a single coin. Raises if LUNARCRUSH_KEY isn't set;
    callers that want to treat "not configured" as an empty result rather
    than an error should check the key themselves before calling this.
    """
    if not LUNARCRUSH_KEY:
        raise RuntimeError("LUNARCRUSH_KEY not configured")

    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            f"{BASE_URL}/{symbol.lower()}/v1",
            headers={"Authorization": f"Bearer {LUNARCRUSH_KEY}"}
        )
        if r.status_code != 200:
            raise RuntimeError(f"LunarCrush API returned {r.status_code}")
        return r.json().get("data", {})


# Every scalar/simple field worth surfacing from a get_coin() payload.
_METADATA_KEYS = (
    "name", "symbol", "price", "price_btc", "market_cap", "market_cap_rank",
    "percent_change_1h", "percent_change_24h", "percent_change_7d", "percent_change_30d",
    "volume_24h", "max_supply", "circulating_supply",
    "galaxy_score", "galaxy_score_previous",
    "alt_rank", "alt_rank_previous",
    "sentiment", "social_volume_24h", "social_dominance", "interactions_24h",
    "categories", "last_updated_price",
)


def extract_metadata(data: dict) -> dict:
    """Pulls every extractable field off a get_coin() payload - raw
    pass-through only, no interpretation (that's scoring's job)."""
    return {k: data.get(k) for k in _METADATA_KEYS}
