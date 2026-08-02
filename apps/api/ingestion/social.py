from config import LUNARCRUSH_KEY
from providers import lunarcrush
from ingestion.base_fetcher import BaseFetcher

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


class SocialFetcher(BaseFetcher):
    key = "social"
    channel = "offchain"

    async def _fetch_payload(self, protocol_id: str) -> dict:
        symbol = PROTOCOL_SYMBOLS.get(protocol_id)
        if not symbol or not LUNARCRUSH_KEY:
            return {}

        data = await lunarcrush.get_coin(symbol)

        return {
            **lunarcrush.extract_metadata(data),
            "social_volume_24h": data.get("social_volume_24h", 0),
            "influence_score":   data.get("galaxy_score", 50),       # LunarCrush Galaxy Score, 0-100
            "sentiment_score":   data.get("sentiment", 3) / 5,       # normalize 1-5 -> 0-1
            "social_dominance":  data.get("social_dominance", 0),    # % of total crypto social
        }
