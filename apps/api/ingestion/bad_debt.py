from db.models import Protocol, engine
from ingestion.base_fetcher import BaseFetcher
from providers import search_llm
from sqlmodel import Session

# Only meaningful for lending-style protocols (bad debt is what's left
# when a liquidation doesn't fully cover a loan) - matches
# apps/web/seed/protocol-detail/*.json's "typed" signal categories
# (TYPED_LABEL in SignalBreakdown.tsx), where badDebt only appears under
# the "lending" category.
_APPLICABLE_CATEGORIES = {"lending"}


def _get_protocol_name_and_category(protocol_id: str) -> tuple[str, str] | None:
    with Session(engine) as session:
        protocol = session.get(Protocol, protocol_id)
        if not protocol:
            return None
        return protocol.name, protocol.category


class BadDebtFetcher(BaseFetcher):
    """
    Ingestion only - whether a lending protocol currently carries
    material bad debt, via a search-grounded LLM question (see
    providers/search_llm.py) rather than a numeric API, since no free
    provider checked this session publishes it (Chaos Labs/Gauntlet have
    dashboards, not a public API). Empty payload for non-lending
    protocols - bad debt isn't a meaningful concept for a DEX or LSD.
    Costs a real LLM call per protocol per ingest cycle, unlike every
    other fetcher in this codebase - not registered in registry.py by
    default; wire it in deliberately once you're OK with that cost.
    """

    key = "bad_debt"
    channel = "offchain"

    async def _fetch_payload(self, protocol_id: str) -> dict:
        config = _get_protocol_name_and_category(protocol_id)
        if not config:
            return {}
        name, category = config
        if category not in _APPLICABLE_CATEGORIES:
            return {}

        result = await search_llm.ask_structured(
            f"Does the DeFi lending protocol {name} currently carry any material bad debt "
            f"(loans where liquidation didn't fully cover the borrowed amount)? "
            f"If so, how much and from what incident? Answer as of today."
        )

        return {
            "bad_debt_summary":    result["raw"],
            "bad_debt_normalized": result["normalized"],
            "confidence":          result["confidence"],
            "source":              "perplexity-search",
        }
