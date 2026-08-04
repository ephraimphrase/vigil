from db.models import Protocol, engine
from ingestion.base_fetcher import BaseFetcher
from providers import llama
from sqlmodel import Session


def _get_protocol_defillama_slugs(protocol_id: str) -> list[str]:
    """Returns DeFiLlama slug(s) for `protocol_id`, falling back to the
    protocol id itself (Protocol.defillama_slug's None default) - same
    convention ingestion/tvl.py uses. More than one slug sums together,
    for protocols split across multiple DeFiLlama entries."""
    with Session(engine) as session:
        protocol = session.get(Protocol, protocol_id)
        if not protocol:
            return [protocol_id]
        return protocol.defillama_slug or [protocol_id]


class FeesFetcher(BaseFetcher):
    """Ingestion only - protocol fee/revenue totals via DeFiLlama's
    /summary/fees/{slug} (see providers/llama.py's get_fees). Not every
    protocol has fee data tracked; a slug DeFiLlama doesn't recognize for
    fees is skipped rather than failing the whole fetch (RuntimeError is
    llama.py's specific "non-200 response" signal, distinct from a real
    network/parse failure, which still propagates as an error)."""

    key = "fees"
    channel = "onchain"

    async def _fetch_payload(self, protocol_id: str) -> dict:
        slugs = _get_protocol_defillama_slugs(protocol_id)

        fees_24h = fees_7d = fees_30d = 0.0
        found = False
        for slug in slugs:
            try:
                data = await llama.get_fees(slug)
            except RuntimeError:
                continue
            found = True
            fees_24h += data.get("total24h") or 0
            fees_7d += data.get("total7d") or 0
            fees_30d += data.get("total30d") or 0

        if not found:
            return {}

        return {
            "fees_24h": fees_24h,
            "fees_7d": fees_7d,
            "fees_30d": fees_30d,
            "source": "defillama",
        }
