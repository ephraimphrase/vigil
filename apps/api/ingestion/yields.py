from datetime import datetime, timezone

from providers import llama
from ingestion.base_fetcher import BaseFetcher

_pools_cache: list = []
_pools_cache_timestamp: datetime | None = None
CACHE_TTL_HOURS = 6


class YieldsFetcher(BaseFetcher):
    """
    Ingestion only - yield-bearing pool data for a protocol via
    DeFiLlama's /pools (see providers/llama.py's get_pools), matched by
    substring against each pool's `project` field (DeFiLlama's yields
    API uses its own per-version project slugs - e.g. "aave-v3",
    "compound-v2"/"compound-v3" - distinct from the defillama_slug
    convention ingestion/tvl.py uses, so this can't reuse that field).
    TVL-weighted average APY, the single highest APY, pool count, and
    total TVL locked across matching pools - deciding whether a yield
    swing signals risk (e.g. a spiking APY often means liquidity just
    fled) is scoring's job, not this fetcher's; see scoring/ for that.
    Not every protocol has yield pools tracked (verified 2026-08-03:
    ~18 of 22 protocols in this app do; Tokemak, Kodiak, Bunni, BaseSwap
    don't) - that's a legitimate empty payload, not an error.
    """

    key = "yields"
    channel = "onchain"

    async def _fetch_payload(self, protocol_id: str) -> dict:
        pools = await _get_pools_list()
        proto = protocol_id.lower()

        matches = [p for p in pools if proto in (p.get("project") or "").lower()]
        if not matches:
            return {}

        total_tvl = sum(p.get("tvlUsd") or 0 for p in matches)
        apys = [(p.get("apy") or 0, p.get("tvlUsd") or 0) for p in matches]
        weighted_apy = (
            sum(apy * tvl for apy, tvl in apys) / total_tvl if total_tvl > 0 else 0.0
        )
        max_apy = max((p.get("apy") or 0 for p in matches), default=0.0)

        return {
            "pool_count":       len(matches),
            "total_pool_tvl":   round(total_tvl, 2),
            "avg_apy":          round(weighted_apy, 4),
            "max_apy":          round(max_apy, 4),
            "source":           "defillama",
        }


async def _get_pools_list() -> list:
    global _pools_cache, _pools_cache_timestamp
    now = datetime.now(timezone.utc)

    if _pools_cache_timestamp and (now - _pools_cache_timestamp).total_seconds() < CACHE_TTL_HOURS * 3600:
        return _pools_cache

    try:
        _pools_cache = await llama.get_pools()
        _pools_cache_timestamp = now
    except Exception as e:
        print(f"[WARN] Failed to fetch pools list: {e}")

    return _pools_cache
