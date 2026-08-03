from db.models import Protocol, engine
from ingestion.base_fetcher import BaseFetcher
from providers import snapshot as snapshot_api
from sqlmodel import Session


def _get_protocol_snapshot_space(protocol_id: str) -> str | None:
    """Returns the Snapshot.org space ENS name `protocol_id` polls, or None
    if untracked (no space, or the protocol moved to on-chain governance)."""
    with Session(engine) as session:
        protocol = session.get(Protocol, protocol_id)
        return protocol.snapshot_space if protocol else None


class SnapshotFetcher(BaseFetcher):
    """
    Ingestion only - queries Snapshot's GraphQL API for recent governance
    proposals and returns them as raw text. Judging whether a proposal is
    an emergency measure (pausing contracts, freezing treasury, etc.) is
    scoring's job, not this fetcher's; see scoring/ for that. An empty
    payload (no space tracked, or no recent proposals) is a legitimate
    "nothing to flag" result - normalizer.py already defaults
    governance_risk_score to 1.0 (fully healthy) when it's absent.
    """

    key = "snapshot"
    channel = "offchain"

    async def _fetch_payload(self, protocol_id: str) -> dict:
        space = _get_protocol_snapshot_space(protocol_id)
        if not space:
            return {}

        proposals_raw = await snapshot_api.get_proposals(space)
        if not proposals_raw:
            return {}

        proposals_text = []
        for p in proposals_raw:
            title = p.get("title", "Untitled")
            body_snippet = (p.get("body") or "")[:200].replace("\n", " ")
            proposals_text.append(f"Title: {title}\nBody: {body_snippet}")

        return {"recent_proposals": proposals_text}
