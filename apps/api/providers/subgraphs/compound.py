"""
Compound subgraph ids on The Graph Network. Use with providers/thegraph.py:
thegraph.query(SUBGRAPHS["v3_ethereum"], your_query). See
apps/api/subgraphs.md for sourcing/confidence notes.
"""

SUBGRAPHS = {
    "v3_ethereum": "AwoxEZbiWLvv6e3QdvdMZw4WDURdGbvPfHmZRc8Dpfz9",  # Messari, community, not Compound-team-published
    # No v2 (compound-finance/compound-v2-subgraph) Graph Network id verified -
    # only the GitHub source repo was confirmed, no live deployment id.
}
