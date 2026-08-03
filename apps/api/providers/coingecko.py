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


async def get_coin(coin_id: str) -> dict:
    """
    Full /coins/{id} payload - description, links, and market_data
    (current price, market cap, fdv, ATH/ATL, 24h/7d/30d/1y price change,
    circulating/total/max supply, and more). `coin_id` is CoinGecko's own
    slug (e.g. "aave"), not a ticker symbol.
    """
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(
            f"{BASE_URL}/coins/{coin_id}",
            params={
                "localization": "false",
                "tickers": "false",
                "market_data": "true",
                "community_data": "false",
                "developer_data": "false",
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
