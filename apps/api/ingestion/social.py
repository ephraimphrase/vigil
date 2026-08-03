from config import LUNARCRUSH_KEY
from db.models import Protocol, engine
from providers import lunarcrush
from ingestion.base_fetcher import BaseFetcher
from sqlmodel import Session


def _get_protocol_lunarcrush_symbol(protocol_id: str) -> str | None:
    """Returns the LunarCrush ticker symbol `protocol_id` polls, or None if untracked."""
    with Session(engine) as session:
        protocol = session.get(Protocol, protocol_id)
        return protocol.lunarcrush_symbol if protocol else None


class SocialFetcher(BaseFetcher):
    key = "social"
    channel = "offchain"

    async def _fetch_payload(self, protocol_id: str) -> dict:
        symbol = _get_protocol_lunarcrush_symbol(protocol_id)
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
