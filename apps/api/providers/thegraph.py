"""
Raw The Graph Network client - "how to talk to The Graph" lives here,
separate from what any given fetcher does with the response.

Deliberately generic: The Graph Network hosts thousands of independently
published subgraphs, each with its own schema, so there's no single
"get whale transfers" call the way providers/llama.py has get_tvl().
Callers pass a subgraph_id (the id in a subgraph's explorer URL, e.g.
thegraph.com/explorer/subgraphs/{subgraph_id}) plus their own GraphQL
query/variables, and get the raw `data` object back untouched.
"""

import httpx
from config import THEGRAPH_API_KEY

BASE_URL = "https://gateway.thegraph.com/api/subgraphs/id"


async def query(subgraph_id: str, graphql_query: str, variables: dict | None = None) -> dict:
    """
    Runs `graphql_query` against the subgraph identified by `subgraph_id`
    (the chain it's indexed on is baked into the subgraph itself, not a
    separate param - the same id always hits the same chain). Returns
    the `data` object as-is; callers own interpreting their own schema.
    """
    if not THEGRAPH_API_KEY:
        raise RuntimeError("THEGRAPH_API_KEY not configured")

    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(
            f"{BASE_URL}/{subgraph_id}",
            headers={"Authorization": f"Bearer {THEGRAPH_API_KEY}"},
            json={"query": graphql_query, "variables": variables or {}},
        )
        if r.status_code != 200:
            raise RuntimeError(f"The Graph API returned {r.status_code}")

        body = r.json()
        if body.get("errors"):
            raise RuntimeError(f"The Graph query errors: {body['errors']}")
        return body.get("data", {})
