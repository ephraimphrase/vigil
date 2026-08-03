import logging

from config import LUNARCRUSH_KEY
from db.models import Protocol, engine
from providers import coingecko, lunarcrush
from ingestion.base_fetcher import BaseFetcher
from sqlmodel import Session

logger = logging.getLogger(__name__)


def _get_protocol_social_config(protocol_id: str) -> tuple[str | None, str | None]:
    """Returns (lunarcrush_symbol, coingecko_id) for `protocol_id`.
    coingecko_id falls back to the protocol id itself, same as
    ingestion/market.py's fallback (Protocol.coingecko_id's None
    default) - both None only if the protocol row doesn't exist."""
    with Session(engine) as session:
        protocol = session.get(Protocol, protocol_id)
        if not protocol:
            return None, None
        return protocol.lunarcrush_symbol, (protocol.coingecko_id or protocol_id)


class SocialFetcher(BaseFetcher):
    """Ingestion only - social/community metrics. LunarCrush is the
    primary source (galaxy score, sentiment, social volume/dominance -
    richer, but needs LUNARCRUSH_KEY and a per-protocol symbol). Falls
    back to CoinGecko's community_data (see providers/coingecko.py's
    extract_community_metadata) when LunarCrush isn't configured/tracked
    for this protocol, or its call fails - raw Reddit/Telegram counts
    only, no sentiment or influence score (CoinGecko doesn't compute
    those, so this doesn't fabricate substitutes for them under
    LunarCrush's field names)."""

    key = "social"
    channel = "offchain"

    async def _fetch_payload(self, protocol_id: str) -> dict:
        symbol, coingecko_id = _get_protocol_social_config(protocol_id)

        if symbol and LUNARCRUSH_KEY:
            try:
                data = await lunarcrush.get_coin(symbol)
                return {
                    **lunarcrush.extract_metadata(data),
                    "social_volume_24h": data.get("social_volume_24h", 0),
                    "influence_score":   data.get("galaxy_score", 50),       # LunarCrush Galaxy Score, 0-100
                    "sentiment_score":   data.get("sentiment", 3) / 5,       # normalize 1-5 -> 0-1
                    "social_dominance":  data.get("social_dominance", 0),    # % of total crypto social
                    "source":            "lunarcrush",
                }
            except Exception as e:
                logger.warning(f"[WARN] LunarCrush fetch failed for {protocol_id}, falling back to CoinGecko: {e}")

        if not coingecko_id:
            return {}

        data = await coingecko.get_coin(coingecko_id, community_data=True)
        return {**coingecko.extract_community_metadata(data), "source": "coingecko"}
