from datetime import datetime, timezone

from providers import llama
from ingestion.base_fetcher import BaseFetcher

_hacks_cache: list = []
_hacks_cache_timestamp: datetime | None = None
CACHE_TTL_HOURS = 6


class SecurityFetcher(BaseFetcher):
    """Ingestion only - raw, human-readable hack records for this protocol.
    Deciding what a given hack means for risk (recency, severity, whether
    funds were returned) is scoring's job, not this fetcher's; see
    scoring/ for that."""

    key = "security"
    channel = "offchain"

    async def _fetch_payload(self, protocol_id: str) -> dict:
        # DeFiLlama is the only hack source right now. When a second
        # provider is added, merge its records into `hacks` here (dedupe
        # by name+date) before matching/describing - the rest of this
        # method and _describe()'s output shape shouldn't need to change.
        hacks = await _get_hacks_list()
        proto = protocol_id.lower()

        matches = [h for h in hacks if _matches(h, proto)]
        matches.sort(key=_hack_date, reverse=True)

        return {
            "hack_count": len(matches),
            "hacks": [_describe(h) for h in matches],
            "source": "defillama",
        }


def _matches(hack: dict, proto: str) -> bool:
    name = hack.get("name", "").lower()
    return proto in name or name in proto


def _hack_date(hack: dict) -> datetime:
    ts = hack.get("date", 0)
    try:
        return datetime.fromtimestamp(int(ts), tz=timezone.utc) if ts else datetime.min.replace(tzinfo=timezone.utc)
    except (ValueError, OSError):
        return datetime.min.replace(tzinfo=timezone.utc)


def _describe(hack: dict) -> dict:
    """Plain-language record of a single hack, for the LLM to read directly
    - no pre-computed scores or windows, just the facts DeFiLlama gives us."""
    return {
        "name":            hack.get("name"),
        "date":            _hack_date(hack).strftime("%Y-%m-%d"),
        "amount_lost_usd": hack.get("amount", 0) or 0,
        "classification":  hack.get("classification"),
        "technique":       hack.get("technique"),
        "chains":          hack.get("chain", []),
        "funds_returned":  bool(hack.get("returnedFunds")),
    }


async def _get_hacks_list() -> list:
    global _hacks_cache, _hacks_cache_timestamp
    now = datetime.now(timezone.utc)

    if _hacks_cache_timestamp and (now - _hacks_cache_timestamp).total_seconds() < CACHE_TTL_HOURS * 3600:
        return _hacks_cache

    try:
        _hacks_cache = await llama.get_hacks()
        _hacks_cache_timestamp = now
    except Exception as e:
        print(f"[WARN] Failed to fetch hacks list: {e}")

    return _hacks_cache
