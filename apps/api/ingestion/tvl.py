from datetime import datetime

from db.models import Protocol, SignalHistory, engine
from providers import llama
from ingestion.base_fetcher import BaseFetcher
from sqlmodel import Session, select


def _get_protocol_defillama_slugs(protocol_id: str) -> tuple[list[str], bool]:
    """Returns (slugs, use_fast_endpoint) for `protocol_id`. Falls back to
    [protocol_id] as the sole slug when defillama_slug isn't set - that
    already matches DeFiLlama for most protocols. More than one slug means
    this protocol is split across multiple DeFiLlama entries (e.g.
    Velodrome's v2/v3) - their TVL gets summed together."""
    with Session(engine) as session:
        protocol = session.get(Protocol, protocol_id)
        if not protocol:
            return [protocol_id], False
        return protocol.defillama_slug or [protocol_id], protocol.defillama_use_fast_endpoint


def _delta_since_last_poll(protocol_id: str, current_tvl: float) -> float:
    """Delta vs. the last time this protocol's TVL was fetched (~15
    minutes ago at the app's normal polling cadence - see scoring's
    SYSTEM_PROMPT). DeFiLlama's own series is daily, so this is the only
    source for a sub-daily delta; also records `current_tvl` as this
    poll's data point for next time."""
    with Session(engine) as session:
        last_row = session.exec(
            select(SignalHistory)
            .where(SignalHistory.protocol == protocol_id, SignalHistory.key == "tvl_current")
            .order_by(SignalHistory.timestamp.desc())
            .limit(1)
        ).first()
        # Read before commit() - commit() expires ORM instances by default,
        # and last_row would otherwise need a session that's already closed
        # by the time it's touched below.
        last_value = last_row.value if last_row else None

        session.add(SignalHistory(
            protocol=protocol_id, timestamp=datetime.utcnow(), key="tvl_current", value=current_tvl,
        ))
        session.commit()

    if not last_value:
        return 0.0
    return (current_tvl - last_value) / last_value


class TvlFetcher(BaseFetcher):
    """
    Fetches TVL via the DeFiLlama API.

    Uses two endpoints:
    - /tvl/{slug}       — fast, returns current TVL only (used for large protocols)
    - /protocol/{slug}  — full time-series + per-chain breakdown, used to calculate 24h/7d/30d deltas

    A protocol can list more than one slug (Protocol.defillama_slug) when
    DeFiLlama tracks it as multiple separate entries (e.g. Velodrome's
    v2/v3) - each slug is fetched and their TVL summed together.

    Verified endpoints (2026-07-22):
      aave.fi/protocol/aave            ~100KB  OK
      api.llama.fi/protocol/compound-v3 ~80KB  OK
      api.llama.fi/protocol/uniswap-v3  ~1.6MB TIMEOUT at 10s -> use /tvl instead
    """

    key = "tvl"
    channel = "onchain"

    async def _fetch_payload(self, protocol_id: str) -> dict:
        slugs, use_fast_endpoint = _get_protocol_defillama_slugs(protocol_id)
        if use_fast_endpoint:
            payload = await _fetch_tvl_simple(slugs)
        else:
            payload = await _fetch_tvl_with_deltas(slugs)

        # Self-tracked, independent of which DeFiLlama endpoint answered -
        # both give a current tvl_current to diff against our own last poll.
        payload["tvl_delta_15m"] = round(_delta_since_last_poll(protocol_id, payload["tvl_current"]), 6)
        payload["source"] = "defillama"
        return payload


async def _fetch_tvl_simple(slugs: list[str]) -> dict:
    """Uses /tvl/{slug} — returns just current TVL (summed across all
    `slugs`), no delta calculation or chain breakdown (the fast endpoint
    is a bare number, not the full protocol payload)."""
    current_tvl = 0.0
    for slug in slugs:
        current_tvl += await llama.get_tvl(slug)

    return {
        "tvl_current":   current_tvl,
        "tvl_delta_24h": 0.0,  # Not available from this endpoint
        "tvl_delta_7d":  0.0,
        "tvl_delta_30d": 0.0,
        "tvl_by_chain":  {},
    }


async def _fetch_tvl_with_deltas(slugs: list[str]) -> dict:
    """Uses /protocol/{slug} — full time-series, so real 24h/7d/30d deltas
    and a per-chain breakdown can be calculated instead of the bare
    current-TVL number /tvl/{slug} gives. When `slugs` has more than one
    entry, each slug's series and chain breakdown are summed together.

    Each series' *last* entry is live-timestamped at the exact moment of
    that API call rather than aligned to the daily boundary every earlier
    entry uses - two slugs fetched moments apart can even land on
    opposite sides of a UTC day boundary. So the live point is summed
    into tvl_current directly (no date matching needed), and only the
    remaining, cleanly day-aligned history gets merged by day for delta
    calculation."""
    tvl_by_day: dict[int, float] = {}
    chain_tvls: dict[str, float] = {}
    current_tvl = 0.0

    for slug in slugs:
        data = await llama.get_protocol(slug)

        series = data.get("tvl", [])
        if not series or not isinstance(series, list):
            raise RuntimeError(f"DeFiLlama /protocol/{slug} returned no tvl series")

        current_tvl += series[-1].get("totalLiquidityUSD", 0) or 0
        for point in series[:-1]:
            date = point.get("date")
            if date is None:
                continue
            tvl_by_day[date] = tvl_by_day.get(date, 0.0) + (point.get("totalLiquidityUSD", 0) or 0)

        for chain, value in _extract_chain_tvls(data).items():
            chain_tvls[chain] = chain_tvls.get(chain, 0.0) + value

    # "Yesterday" (1 day back) through the front, since today's live point
    # isn't part of this series - see current_tvl above.
    historical_series = [{"totalLiquidityUSD": v} for _, v in sorted(tvl_by_day.items())]

    return {
        "tvl_current":   current_tvl,
        "tvl_delta_24h": round(_delta_at(historical_series, current_tvl, 1), 6),
        "tvl_delta_7d":  round(_delta_at(historical_series, current_tvl, 7), 6),
        "tvl_delta_30d": round(_delta_at(historical_series, current_tvl, 30), 6),
        "tvl_by_chain":  chain_tvls,
    }


def _delta_at(tvl_series: list, current_tvl: float, points_back: int) -> float:
    """Fractional change from `points_back` daily entries ago to
    `current_tvl`, where `tvl_series` is history *not* including today
    (see _fetch_tvl_with_deltas) - one entry per day, so points_back=1 is
    "24h ago", 7 is "7d ago", 30 is "30d ago"."""
    if len(tvl_series) < points_back:
        return 0.0
    prev = tvl_series[-points_back].get("totalLiquidityUSD", current_tvl) or current_tvl
    return ((current_tvl - prev) / prev) if prev else 0.0


# DeFiLlama's chainTvls mixes real chain totals in with non-chain category
# breakdowns (lending protocols split out "borrowed" separately from the
# supplied-side total, per chain and as a bare cross-chain aggregate) -
# these aren't chains and would pollute a "which chain is this localized
# to" signal, so they're filtered out below.
_NON_CHAIN_KEYS = {"borrowed", "staking", "pool2", "vesting"}
_NON_CHAIN_SUFFIXES = ("-borrowed", "-staking", "-pool2", "-vesting")


def _extract_chain_tvls(data: dict) -> dict[str, float]:
    """Current TVL per real chain from chainTvls - lets scoring tell a
    localized issue (one chain's TVL cratering) from a protocol-wide one."""
    result = {}
    for chain, chain_data in data.get("chainTvls", {}).items():
        if chain in _NON_CHAIN_KEYS or chain.endswith(_NON_CHAIN_SUFFIXES):
            continue
        series = chain_data.get("tvl", []) if isinstance(chain_data, dict) else []
        if series:
            result[chain] = series[-1].get("totalLiquidityUSD", 0) or 0
    return result
