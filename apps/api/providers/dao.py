"""
Raw DAO governance client (currently just Snapshot.org's GraphQL API) -
"how to talk to Snapshot" lives here, separate from what
ingestion/dao.py does with the response. Named for what it does
(fetch DAO governance data) rather than the one provider behind it today,
so a second off-chain governance source can live alongside
get_active_proposals without another rename.
"""

import httpx

GRAPHQL_URL = "https://hub.snapshot.org/graphql"

_ACTIVE_PROPOSALS_QUERY = """
query Proposals($spaces: [String!]!) {
  proposals(
    first: 10,
    skip: 0,
    where: { space_in: $spaces, state: "active" },
    orderBy: "created",
    orderDirection: asc
  ) {
    id
    title
    body
    choices
    start
    end
    snapshot
    state
    author
    space {
      id
      name
    }
  }
}
"""


async def get_active_proposals(spaces: list[str]) -> list[dict]:
    """Currently-active proposals across every space in `spaces` in one
    call (space_in), oldest-active-first. Unlike the old per-space "most
    recent 5 regardless of state", this only returns what's votable right
    now - a closed proposal from last month isn't actionable the way an
    active one is."""
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(
            GRAPHQL_URL,
            json={"query": _ACTIVE_PROPOSALS_QUERY, "variables": {"spaces": spaces}}
        )
        if r.status_code != 200:
            raise RuntimeError(f"Snapshot API returned {r.status_code}")
        return r.json().get("data", {}).get("proposals", [])
