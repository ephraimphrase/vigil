"""
Kodiak Finance subgraph ids on The Graph Network. Use with
providers/thegraph.py: thegraph.query(SUBGRAPHS["v2"], your_query). See
apps/api/subgraphs.md for sourcing/confidence notes. Kodiak's own docs
(documentation.kodiak.finance) confirm a subgraph exists, but they also
offer Goldsky as an alternative - the ids below weren't cross-checked
against Kodiak's docs page directly.
"""

SUBGRAPHS = {
    "v2": "2YL8gVAQtgkP8kW8KcM7Yv86GUwJpkSWa7dvNoVHs5yX",  # berachain-v2-kodiak
    "v1": "7P9DAPWihEJ3QHrR9eeEp3KAP9FgTTo2SnzAaXXPQSau",  # berachain-v1-kodiak
}
