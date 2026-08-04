from db.models import Protocol, engine
from ingestion.base_fetcher import BaseFetcher
from providers import ethplorer
from sqlmodel import Session


def _get_protocol_whale_token(protocol_id: str) -> tuple[str, str] | None:
    """Returns (token_address, chain) for `protocol_id`, or None if no
    token tracked. `chain` is the raw Protocol.chain value (e.g.
    "ethereum") - Ethplorer only covers Ethereum mainnet."""
    with Session(engine) as session:
        protocol = session.get(Protocol, protocol_id)
        if not protocol or not protocol.whale_token_address:
            return None
        return protocol.whale_token_address, protocol.chain


class WhalesFetcher(BaseFetcher):
    """
    Static holder concentration via Ethplorer's free "freekey" (see
    providers/ethplorer.py) - holders_count, top_holder_pct (largest
    single holder's % of supply), top10_holder_pct (top 10 holders'
    combined %). Ethereum mainnet only; no API key configuration needed.
    """

    key = "whales"
    channel = "onchain"

    async def _fetch_payload(self, protocol_id: str) -> dict:
        config = _get_protocol_whale_token(protocol_id)
        if not config:
            return {}
        token, chain = config
        if chain != "ethereum":
            return {}

        info = await ethplorer.get_token_info(token)
        holders = await ethplorer.get_top_holders(token, limit=10)

        return {
            "holders_count":    info.get("holdersCount"),
            "top_holder_pct":   holders[0]["share"] if holders else None,
            "top10_holder_pct": round(sum(h["share"] for h in holders), 2) if holders else None,
            "source":           "ethplorer",
        }
