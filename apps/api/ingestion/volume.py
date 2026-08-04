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


class VolumeFetcher(BaseFetcher):
    """Ingestion only - DEX trading volume totals via DeFiLlama's
    /summary/dexs/{slug} (see providers/llama.py's get_dex_volume). Only
    meaningful for DEX-type protocols (Curve, Velodrome, Shadow, etc.) -
    lending/vault protocols correctly get an empty payload here, not an
    error (RuntimeError is llama.py's specific "non-200 response" signal,
    distinct from a real network/parse failure, which still propagates
    as an error)."""

    key = "volume"
    channel = "onchain"

    async def _fetch_payload(self, protocol_id: str) -> dict:
        slugs = _get_protocol_defillama_slugs(protocol_id)

        volume_24h = volume_7d = volume_30d = 0.0
        found = False
        for slug in slugs:
            try:
                data = await llama.get_dex_volume(slug)
            except RuntimeError:
                continue
            found = True
            volume_24h += data.get("total24h") or 0
            volume_7d += data.get("total7d") or 0
            volume_30d += data.get("total30d") or 0

        if not found:
            return {}

        return {
            "volume_24h": volume_24h,
            "volume_7d": volume_7d,
            "volume_30d": volume_30d,
            "source": "defillama",
        }
