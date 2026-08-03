"""
Bunni subgraph ids on The Graph Network. Use with providers/thegraph.py:
thegraph.query(SUBGRAPHS["v2_mainnet"], your_query). See
apps/api/subgraphs.md for sourcing/confidence notes.
"""

SUBGRAPHS = {
    "v2_mainnet":  "5NFnHtgpdzB3JhVyiKQgnV9dZsewqJtX5HZfAT9Kg66r",  # Ethereum (moderate confidence)
    "v2_arbitrum": "96tZMr51QupqWYamom12Yki5AqCJEiHWbVUpzUpvu9oB",
    "v2_base":     "3oawHiCt7L9wJTEY9DynwAEmoThy8bvRhuMZdaaAooqW",
}
