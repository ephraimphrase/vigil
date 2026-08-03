"""
Raw Snapshot.org GraphQL client - "how to talk to Snapshot" lives here,
separate from what ingestion/snapshot.py does with the response.
"""

import httpx

GRAPHQL_URL = "https://hub.snapshot.org/graphql"

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


async def get_proposals(space: str) -> list[dict]:
    """Most recent 5 proposals for `space` - id, title, body, state."""
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(
            GRAPHQL_URL,
            json={"query": _PROPOSALS_QUERY, "variables": {"space": space}}
        )
        if r.status_code != 200:
            raise RuntimeError(f"Snapshot API returned {r.status_code}")
        return r.json().get("data", {}).get("proposals", [])
