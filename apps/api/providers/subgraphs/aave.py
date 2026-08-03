"""
Aave subgraph ids on The Graph Network. Use with providers/thegraph.py:
thegraph.query(SUBGRAPHS["v3"], your_query). See apps/api/subgraphs.md
for sourcing/confidence notes.
"""

SUBGRAPHS = {
    "v3": "HB1Z2EAw4rtPRYVb2Nz8QGFLHCpym6ByBX6vbCViuE9F",  # Ethereum - matches aave/protocol-subgraphs (good confidence)
    "v2": "CvvUWXNtn8A5zVAtM8ob3JGq8kQS8BLrzL6WJV7FrHRy",  # Ethereum (moderate confidence)
}
