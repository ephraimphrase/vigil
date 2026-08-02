import httpx
from ingestion.base_fetcher import BaseFetcher

SNAPSHOT_GRAPHQL_URL = "https://hub.snapshot.org/graphql"

# Space IDs verified live against hub.snapshot.org on 2026-07-22
# aave.eth is stale — active space is aavedao.eth
# uniswap is stale — active space is uniswapgovernance.eth
# makerdao.eth has no proposals — MakerDAO/Sky moved to on-chain governance (excluded)
PROTOCOL_SPACES = {
    "aave":      "aavedao.eth",
    "compound":  "comp-vote.eth",
    "uniswap":   "uniswapgovernance.eth",
    "lido":      "lido-snapshot.eth",
    "balancer":  "balancer.eth",
}

_PROPOSALS_QUERY = """
query Proposals($space: String!) {
  proposals(
    first: 5,
    skip: 0,
    where: { space: $space },
    orderBy: "created",
    orderDirection: desc
  ) {
    id
    title
    body
    state
  }
}
"""


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
        space = PROTOCOL_SPACES.get(protocol_id)
        if not space:
            return {}

        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(
                SNAPSHOT_GRAPHQL_URL,
                json={"query": _PROPOSALS_QUERY, "variables": {"space": space}}
            )
            if r.status_code != 200:
                raise RuntimeError(f"Snapshot API returned {r.status_code}")
            proposals_raw = r.json().get("data", {}).get("proposals", [])

        if not proposals_raw:
            return {}

        proposals_text = []
        for p in proposals_raw:
            title = p.get("title", "Untitled")
            body_snippet = (p.get("body") or "")[:200].replace("\n", " ")
            proposals_text.append(f"Title: {title}\nBody: {body_snippet}")

        return {"recent_proposals": proposals_text}
