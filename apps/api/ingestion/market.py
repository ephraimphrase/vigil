from db.models import Protocol, engine
from ingestion.base_fetcher import BaseFetcher
from providers import coingecko
from sqlmodel import Session


def _get_protocol_coingecko_id(protocol_id: str) -> str | None:
    """Returns the CoinGecko coin id `protocol_id` polls, falling back to
    the protocol id itself (Protocol.coingecko_id's None default), since
    that already matches CoinGecko for some protocols. None only when the
    protocol row itself doesn't exist."""
    with Session(engine) as session:
        protocol = session.get(Protocol, protocol_id)
        if not protocol:
            return None
        return protocol.coingecko_id or protocol_id


class MarketFetcher(BaseFetcher):
    """Ingestion only - price/market-cap/supply data via CoinGecko (see
    providers/coingecko.py). Returns extract_metadata()'s full raw
    pass-through (current price, market cap, fdv, 24h/7d/14d/30d/1y price
    change, circulating/total/max supply, ATH/ATL) - deciding what a
    price move means for risk is scoring's job, not this fetcher's; see
    scoring/ for that."""

    key = "market"
    channel = "offchain"

    async def _fetch_payload(self, protocol_id: str) -> dict:
        coin_id = _get_protocol_coingecko_id(protocol_id)
        if not coin_id:
            return {}

        data = await coingecko.get_coin(coin_id)
        return {**coingecko.extract_metadata(data), "source": "coingecko"}
