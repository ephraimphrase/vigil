from db.models import Protocol, engine
from providers import llama
from ingestion.base_fetcher import BaseFetcher
from sqlmodel import Session


def _get_protocol_defillama_slug(protocol_id: str) -> tuple[str, bool]:
    """Returns (slug, use_fast_endpoint) for `protocol_id`. Falls back to
    the protocol id itself as the slug when defillama_slug isn't set -
    that already matches DeFiLlama for most protocols."""
    with Session(engine) as session:
        protocol = session.get(Protocol, protocol_id)
        if not protocol:
            return protocol_id, False
        return protocol.defillama_slug or protocol_id, protocol.defillama_use_fast_endpoint


class TvlFetcher(BaseFetcher):
    """
    Fetches TVL (and everything else DeFiLlama exposes about a protocol -
    see providers/llama.py) via the DeFiLlama API.

    Uses two endpoints:
    - /tvl/{slug}       — fast, returns current TVL only (used for large protocols)
    - /protocol/{slug}  — full time-series + metadata, used to calculate 24h/7d deltas

    Verified endpoints (2026-07-22):
      aave.fi/protocol/aave            ~100KB  OK
      api.llama.fi/protocol/compound-v3 ~80KB  OK
      api.llama.fi/protocol/uniswap-v3  ~1.6MB TIMEOUT at 10s -> use /tvl instead
    """

    key = "tvl"
    channel = "onchain"

    async def _fetch_payload(self, protocol_id: str) -> dict:
        slug, use_fast_endpoint = _get_protocol_defillama_slug(protocol_id)
        if use_fast_endpoint:
            return await _fetch_tvl_simple(slug)
        return await _fetch_tvl_with_deltas(slug)


async def _fetch_tvl_simple(slug: str) -> dict:
    """Uses /tvl/{slug} — returns just current TVL, no delta calculation
    and none of the extra metadata below (the fast endpoint is a bare
    number, not the full protocol payload)."""
    current_tvl = await llama.get_tvl(slug)
    return {
        "tvl_current":   current_tvl,
        "tvl_delta_24h": 0.0,  # Not available from this endpoint
        "tvl_delta_7d":  0.0,
    }


async def _fetch_tvl_with_deltas(slug: str) -> dict:
    """Uses /protocol/{slug} — full time-series, calculates real 24h/7d deltas,
    plus everything else providers/llama.py's extract_metadata() pulls
    off the same payload for free."""
    data = await llama.get_protocol(slug)

    tvl_series = data.get("tvl", [])
    if not tvl_series or not isinstance(tvl_series, list):
        raise RuntimeError(f"DeFiLlama /protocol/{slug} returned no tvl series")

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
        **llama.extract_metadata(data),
    }
