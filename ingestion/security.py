import httpx
from datetime import datetime, timedelta

DEFILLAMA_HACKS_URL = "https://defillama.com/api/hacks"

_hacks_cache: list = []
_hacks_cache_timestamp = None
CACHE_TTL_HOURS = 6

async def fetch_security_signals(protocol: str) -> dict:
    hacks = await _get_hacks_list()
    cutoff_90d = datetime.utcnow() - timedelta(days=90)
    cutoff_180d = datetime.utcnow() - timedelta(days=180)

    def matches(hack: dict) -> bool:
        name = hack.get("name", "").lower()
        return protocol.lower() in name or name in protocol.lower()

    def parse_date(hack: dict) -> datetime:
        ts = hack.get("date", 0)
        return datetime.utcfromtimestamp(ts) if ts else datetime.min

    recent_hacks_90d  = [h for h in hacks if matches(h) and parse_date(h) > cutoff_90d]
    recent_hacks_180d = [h for h in hacks if matches(h) and parse_date(h) > cutoff_180d]
    total_lost_90d    = sum(h.get("amountCryptocurrencies", 0) or 0 for h in recent_hacks_90d)

    return {
        "hack_count_90d":  len(recent_hacks_90d),
        "hack_count_180d": len(recent_hacks_180d),
        "total_lost_90d":  total_lost_90d,
    }

async def _get_hacks_list() -> list:
    global _hacks_cache, _hacks_cache_timestamp
    now = datetime.utcnow()
    
    if _hacks_cache_timestamp and (now - _hacks_cache_timestamp).total_seconds() < CACHE_TTL_HOURS * 3600:
        return _hacks_cache

    async with httpx.AsyncClient(timeout=15) as client:
        try:
            r = await client.get(DEFILLAMA_HACKS_URL)
            if r.status_code == 200:
                _hacks_cache = r.json()
                _hacks_cache_timestamp = now
        except Exception as e:
            print(f"[WARN] Failed to fetch hacks list: {e}")

    return _hacks_cache
