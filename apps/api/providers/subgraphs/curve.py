"""
Curve subgraph ids on The Graph Network. Use with providers/thegraph.py:
thegraph.query(SUBGRAPHS["deployment_1"], your_query). See
apps/api/subgraphs.md for sourcing/confidence notes.

Both known deployments are marked deprecated / years stale on Graph
Explorer - treat these as low-confidence, likely not reflecting current
TVL.
"""

SUBGRAPHS = {
    "deployment_1": "GAGwGKc4ArNKKq9eFTcwgd1UGymvqhTier9Npqo1YvZB",  # deprecated, ~3yr stale
    "deployment_2": "8ZYPVcHQZXvpnFD1FseQnuvWhCXQEAfC9P6CsuLS4X1K",  # deprecated, ~4yr stale
}
