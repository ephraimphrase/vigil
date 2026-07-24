import httpx
from ingestion.schemas import TvlSignal

# Slugs verified live against https://api.llama.fi/protocols on 2026-07-22
_SLUG_MAP = {
    "aave":      "aave",
    "compound":  "compound-v3",   # compound-v3 has the most TVL ($1.17B)
    "uniswap":   "uniswap-v3",   # uniswap-v3 has the most TVL ($1.52B)
    "curve":     "curve-dex",
    "makerdao":  "makerdao",
    "lido":      "lido",
}

# Protocols whose /protocol/{slug} response is large (>500KB) and will timeout.
# For these we use the /tvl/{slug} fast endpoint instead and skip delta calculation.
_LARGE_PROTOCOL_SLUGS = {"uniswap-v3"}


async def fetch_tvl(protocol: str) -> TvlSignal:
    """
    Fetches TVL using DeFiLlama API.

    Uses two endpoints:
    - /tvl/{slug}       — fast, returns current TVL only (used for large protocols)
    - /protocol/{slug}  — full time-series, used to calculate 24h/7d deltas

    Verified endpoints (2026-07-22):
      aave.fi/protocol/aave            ~100KB  OK
      api.llama.fi/protocol/compound-v3 ~80KB  OK
      api.llama.fi/protocol/uniswap-v3  ~1.6MB TIMEOUT at 10s -> use /tvl instead
    """
    slug = _SLUG_MAP.get(protocol, protocol)
    empty: TvlSignal = {"tvl_current": 0, "tvl_delta_24h": 0.0, "tvl_delta_7d": 0.0}

    if slug in _LARGE_PROTOCOL_SLUGS:
        return await _fetch_tvl_simple(slug, empty)
    else:
        return await _fetch_tvl_with_deltas(slug, empty, protocol)


async def _fetch_tvl_simple(slug: str, empty: TvlSignal) -> TvlSignal:
    """Uses /tvl/{slug} — returns just current TVL, no delta calculation."""
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            r = await client.get(f"https://api.llama.fi/tvl/{slug}")
            if r.status_code != 200:
                return empty
            current_tvl = float(r.text.strip())
            return {
                "tvl_current":   current_tvl,
                "tvl_delta_24h": 0.0,  # Not available from this endpoint
                "tvl_delta_7d":  0.0,
            }
        except Exception as e:
            print(f"[WARN] TVL (simple) fetch failed for slug={slug}: {e}")
            return empty


async def _fetch_tvl_with_deltas(slug: str, empty: TvlSignal, protocol: str) -> TvlSignal:
    """Uses /protocol/{slug} — full time-series, calculates real 24h/7d deltas."""
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            r = await client.get(f"https://api.llama.fi/protocol/{slug}")
            if r.status_code != 200:
                return empty

            data = r.json()
            tvl_series = data.get("tvl", [])

            if not tvl_series or not isinstance(tvl_series, list):
                return empty

            current_tvl = tvl_series[-1].get("totalLiquidityUSD", 0) or 0

            tvl_delta_24h = 0.0
            if len(tvl_series) >= 2:
                prev = tvl_series[-2].get("totalLiquidityUSD", current_tvl) or current_tvl
                tvl_delta_24h = ((current_tvl - prev) / prev) if prev else 0.0

            tvl_delta_7d = 0.0
            if len(tvl_series) >= 8:
                prev7 = tvl_series[-8].get("totalLiquidityUSD", current_tvl) or current_tvl
                tvl_delta_7d = ((current_tvl - prev7) / prev7) if prev7 else 0.0

            return {
                "tvl_current":   current_tvl,
                "tvl_delta_24h": round(tvl_delta_24h, 6),
                "tvl_delta_7d":  round(tvl_delta_7d, 6),
            }
        except Exception as e:
            print(f"[WARN] TVL fetch failed for {protocol}: {e}")
            return empty
