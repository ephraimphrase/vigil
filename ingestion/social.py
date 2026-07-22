import httpx
from config import LUNARCRUSH_KEY

LUNARCRUSH_BASE = "https://lunarcrush.com/api4/public/coins"

PROTOCOL_SYMBOLS = {
    "aave":     "AAVE",
    "compound": "COMP",
    "uniswap":  "UNI",
    "curve":    "CRV",
    "makerdao": "MKR",
    "lido":     "LDO",
    "yearn":    "YFI",
    "balancer": "BAL",
}

async def fetch_social_signals(protocol: str) -> dict:
    symbol = PROTOCOL_SYMBOLS.get(protocol)
    if not symbol or not LUNARCRUSH_KEY:
        return _empty_social()

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            r = await client.get(
                f"{LUNARCRUSH_BASE}/{symbol.lower()}/v1",
                headers={"Authorization": f"Bearer {LUNARCRUSH_KEY}"}
            )
            if r.status_code != 200:
                return _empty_social()
            data = r.json().get("data", {})
        except Exception:
            return _empty_social()

    return {
        "social_volume_24h": data.get("social_volume_24h", 0),
        "galaxy_score":      data.get("galaxy_score", 50),       # LunarCrush 0-100
        "lc_sentiment":      data.get("sentiment", 3) / 5,       # normalize 1-5 -> 0-1
        "social_dominance":  data.get("social_dominance", 0),    # % of total crypto social
    }

def _empty_social() -> dict:
    return {
        "social_volume_24h": 0,
        "galaxy_score":      50,
        "lc_sentiment":      0.5,
        "social_dominance":  0,
    }
