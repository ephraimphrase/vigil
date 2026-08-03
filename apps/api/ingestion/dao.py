from db.models import Protocol, engine
from ingestion.base_fetcher import BaseFetcher
from providers import dao as dao_api
from sqlmodel import Session


def _get_protocol_snapshot_spaces(protocol_id: str) -> list[str]:
    """Returns the Snapshot.org space ENS name(s) `protocol_id` polls, or
    [] if untracked (no space, or the protocol moved to on-chain
    governance)."""
    with Session(engine) as session:
        protocol = session.get(Protocol, protocol_id)
        if not protocol or not protocol.snapshot_space:
            return []
        return protocol.snapshot_space


class DaoFetcher(BaseFetcher):
    """
    Ingestion only - queries Snapshot's GraphQL API (via providers/dao.py)
    for currently-active governance proposals across every space a
    protocol is governed through, and returns them as raw text. Judging
    whether a proposal is an emergency measure (pausing contracts,
    freezing treasury, etc.) is scoring's job, not this fetcher's; see
    scoring/ for that. An empty payload (no space tracked, or nothing
    active right now) is a legitimate "nothing to flag" result -
    normalizer.py already defaults governance_risk_score to 1.0 (fully
    healthy) when it's absent.

    key stays "snapshot", not "dao" - it's the stable signal identifier
    baked into the Redis key convention (vigil:data:{protocol}:offchain:
    snapshot), OffchainSignalKey's Literal, and simulation/'s mock data.
    Renaming that is a data-migration-shaped change, not a naming one;
    this rename is just the file/class matching providers/dao.py's name.
    """

    key = "snapshot"
    channel = "offchain"

    async def _fetch_payload(self, protocol_id: str) -> dict:
        spaces = _get_protocol_snapshot_spaces(protocol_id)
        if not spaces:
            return {}

        proposals_raw = await dao_api.get_active_proposals(spaces)
        if not proposals_raw:
            return {}

        proposals_text = []
        for p in proposals_raw:
            title = p.get("title", "Untitled")
            body_snippet = (p.get("body") or "")[:200].replace("\n", " ")
            proposals_text.append(f"Title: {title}\nBody: {body_snippet}")

        return {"recent_proposals": proposals_text, "source": "snapshot"}
