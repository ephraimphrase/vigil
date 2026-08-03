"""
GMX subgraph ids on The Graph Network. Use with providers/thegraph.py:
thegraph.query(SUBGRAPHS["v1_arbitrum"], your_query). See
apps/api/subgraphs.md for sourcing/confidence notes.
"""

SUBGRAPHS = {
    "v1_arbitrum":       "DiR5cWwB3pwXXQWWdus7fDLR2mnFRQLiBFsVmHAH9VAs",  # Messari, community
    "house":             "DJ4SBqiG8A8ytcsNJSuUU2gDTLFXxxPrAN8Aags84JH2",  # community fork
    "arbitrum_alt":      "AuvBjsZMNL5vVMQSNHJvuUwepYhFcoQNKe1rL5Kq4aYr",  # community fork
    "position_router":   "CLez3rGurepm3vEQWC3RaMysLG1WUmuuvyTb41qrxKLu",  # narrower scope, community
    "avalanche":         "6pXgnXcL6mkXBjKX7NyHN7tCudv2JGFnXZ8wf8WbjPXv",
}
