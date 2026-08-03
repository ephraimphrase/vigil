"""
Abracadabra Money subgraph ids on The Graph Network. Use with
providers/thegraph.py: thegraph.query(SUBGRAPHS["arbitrum"], your_query).
See apps/api/subgraphs.md for sourcing/confidence notes.
"""

SUBGRAPHS = {
    "arbitrum": "GnroBYmeLLtKuHNyTNS38hzKki5n4CWaHeaMRqZpU4cr",  # Messari, community (moderate confidence)
    # No live Graph Network id confirmed for Ethereum mainnet - only a
    # deprecated hosted-service reference (messari/abracadabra-money-ethereum).
}
