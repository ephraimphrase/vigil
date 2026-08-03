"""
BaseSwap subgraph ids on The Graph Network. Use with providers/thegraph.py:
thegraph.query(SUBGRAPHS["v2"], your_query). See apps/api/subgraphs.md
for sourcing/confidence notes.
"""

SUBGRAPHS = {
    "v2": "BWHCfpXMHFDx3u4E14hEwv4ST7SUyN89FKJ2RjzWKgA9",       # Base, community (unverified against BaseSwap's own docs)
    "v2_alt": "SU9VhLEYR58QqvRmvCpDQarCkb6fb4cL9Pj3WgNcALD",    # Base, community - ambiguous vs "v2" above, not confirmed which is current
}
