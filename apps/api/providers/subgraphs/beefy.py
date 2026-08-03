"""
Beefy subgraph ids on The Graph Network. See apps/api/subgraphs.md for
sourcing/confidence notes.
"""

# Empty: the only subgraph found (messari/beefy-finance-bsc) uses an old
# IPFS-hash hosted-service-style id ("QmfEtMEgjik9FSZdqAmp2DkNFG4M9TK4Go8uyCUj8EVxY6"),
# not a Graph Network deployment id - it won't resolve against
# gateway.thegraph.com/api/subgraphs/id/. Beefy's actual official data
# source is their own REST API (docs.beefy.finance/developer-documentation/beefy-api),
# not a subgraph.
SUBGRAPHS = {}
