# Subgraph Explorer links — real query() verification, 2026-08-03

Every id currently in `providers/subgraphs/*.py`, as a clickable Graph
Explorer link, with status from an actual `providers/thegraph.query()`
call (not a page scrape) — see thread for how the earlier WebFetch-based
pass in `subgraphs.md` turned out to be unreliable and got superseded by
this. ✅ = real query succeeded. ❌ = query failed (reason noted).
⚠️ = query succeeded but it's the wrong protocol/version.

| Protocol | Key | Link | Status |
|---|---|---|---|
| Aave | v3 | https://thegraph.com/explorer/subgraphs/Cd2gEDVeqnjBn1hSeqFMitw8Q1iiyV9FYUZkLNRcL87g | ✅ confirmed — real recent `liquidationCalls` data, correct schema |
| Aave | v2 | https://thegraph.com/explorer/subgraphs/CvvUWXNtn8A5zVAtM8ob3JGq8kQS8BLrzL6WJV7FrHRy | ❌ subgraph not found |
| Abracadabra | arbitrum | https://thegraph.com/explorer/subgraphs/GnroBYmeLLtKuHNyTNS38hzKki5n4CWaHeaMRqZpU4cr | ⚠️ exists but is **Arrakis Finance**, not Abracadabra |
| Balancer | v3 | https://thegraph.com/explorer/subgraphs/4rixbLvpuBCwXTJSwyAzQgsLR8KprnyMfyCuXT8Fj5cd | ✅ query succeeded |
| BaseSwap | v2 | https://thegraph.com/explorer/subgraphs/BWHCfpXMHFDx3u4E14hEwv4ST7SUyN89FKJ2RjzWKgA9 | ❌ no allocations (no active indexer) |
| BaseSwap | v2_alt | https://thegraph.com/explorer/subgraphs/SU9VhLEYR58QqvRmvCpDQarCkb6fb4cL9Pj3WgNcALD | ✅ query succeeded |
| Bunni | v2_mainnet | https://thegraph.com/explorer/subgraphs/5NFnHtgpdzB3JhVyiKQgnV9dZsewqJtX5HZfAT9Kg66r | ✅ query succeeded |
| Bunni | v2_arbitrum | https://thegraph.com/explorer/subgraphs/96tZMr51QupqWYamom12Yki5AqCJEiHWbVUpzUpvu9oB | ✅ query succeeded |
| Bunni | v2_base | https://thegraph.com/explorer/subgraphs/3oawHiCt7L9wJTEY9DynwAEmoThy8bvRhuMZdaaAooqW | ✅ query succeeded |
| Compound | v3_ethereum | https://thegraph.com/explorer/subgraphs/AwoxEZbiWLvv6e3QdvdMZw4WDURdGbvPfHmZRc8Dpfz9 | ✅ query succeeded |
| Curve | deployment_1 | https://thegraph.com/explorer/subgraphs/GAGwGKc4ArNKKq9eFTcwgd1UGymvqhTier9Npqo1YvZB | ❌ subgraph not found |
| Curve | deployment_2 | https://thegraph.com/explorer/subgraphs/8ZYPVcHQZXvpnFD1FseQnuvWhCXQEAfC9P6CsuLS4X1K | ❌ subgraph not found |
| GMX | v1_arbitrum | https://thegraph.com/explorer/subgraphs/DiR5cWwB3pwXXQWWdus7fDLR2mnFRQLiBFsVmHAH9VAs | ✅ query succeeded |
| GMX | house | https://thegraph.com/explorer/subgraphs/DJ4SBqiG8A8ytcsNJSuUU2gDTLFXxxPrAN8Aags84JH2 | ❌ no allocations |
| GMX | arbitrum_alt | https://thegraph.com/explorer/subgraphs/AuvBjsZMNL5vVMQSNHJvuUwepYhFcoQNKe1rL5Kq4aYr | ❌ no allocations |
| GMX | position_router | https://thegraph.com/explorer/subgraphs/CLez3rGurepm3vEQWC3RaMysLG1WUmuuvyTb41qrxKLu | ❌ no allocations |
| GMX | avalanche | https://thegraph.com/explorer/subgraphs/6pXgnXcL6mkXBjKX7NyHN7tCudv2JGFnXZ8wf8WbjPXv | ✅ query succeeded |
| ICHI | — | — | none found (empty SUBGRAPHS) |
| Kodiak | v2 | https://thegraph.com/explorer/subgraphs/2YL8gVAQtgkP8kW8KcM7Yv86GUwJpkSWa7dvNoVHs5yX | ❌ no allocations |
| Kodiak | v1 | https://thegraph.com/explorer/subgraphs/7P9DAPWihEJ3QHrR9eeEp3KAP9FgTTo2SnzAaXXPQSau | ❌ bad indexers |
| Lido | v1 | https://thegraph.com/explorer/subgraphs/HXfMc1jPHfFQoccWd7VMv66km75FoxVHDMvsJj5vG5vf | ❌ subgraph not found |
| Morpho | v1 | https://thegraph.com/explorer/subgraphs/8Lz789DP5VKLXumTMTgygjU2xtuzx8AhbaacgN5PYCAs | ✅ query succeeded |
| Pendle | v2 | https://thegraph.com/explorer/subgraphs/ExXGU3ub2nrT5stPk5cH4hSk2qunJcMcP8eX5GAhrZhe | ✅ query succeeded |
| Shadow Exchange | core | https://thegraph.com/explorer/subgraphs/HGyx7TCqgbWieay5enLiRjshWve9TjHwiug3m66pmLGR | ✅ query succeeded |
| Silo Finance | mainnet | https://thegraph.com/explorer/subgraphs/GTEyHhRmhRRJkQfrDWsapcZ8sBKAka4GFej6gn3BpJNq | ✅ query succeeded |
| Sky | — | — | none found (empty SUBGRAPHS) |
| Stargate | polygon | https://thegraph.com/explorer/subgraphs/SitmxEcPXXwo5cFK8Y2FSMZNZNQ4gXcGdWBDqo3A7K6 | ❌ bad indexers |
| Stargate | bsc | https://thegraph.com/explorer/subgraphs/6sRx6JNkjz66id39jCK3GMiVnPVuyuv2ntwQVpDzmjRF | ❌ bad indexers |
| Tokemak | — | — | none found (empty SUBGRAPHS) |
| Uniswap | v3 | https://thegraph.com/explorer/subgraphs/A3Np3RQbaBA6oKJgiwDJeo5T3zrYfGHPWFYayMwtNDum | ⚠️ exists but schema is **Uniswap V2** (`uniswapFactory`/`pairs`/`swaps`), not V3 |
| Velodrome | v2 | https://thegraph.com/explorer/subgraphs/7tA4PY1VmbycJeoVtn2mjQK4NbozgwTuZgrxDTxzEDL1 | ❌ no allocations |
| Venus | core_pool | https://thegraph.com/explorer/subgraphs/CwswJ7sfENafqgAYU1upn3hQgoEV2CXXRZRJ7XtgJrKG | ✅ query succeeded |

## Notes

- "no allocations" = the id is real and registered on the network, but
  zero indexers currently serve it — practically unusable right now even
  though it's not literally invalid.
- "bad indexers" = registered with indexers assigned, but those indexers
  are currently failing/unhealthy for this subgraph.
- ✅ only means the query succeeded — for most of these I checked
  existence/reachability, not that the returned data is definitely the
  right protocol (Aave v3, Abracadabra, and Uniswap v3 are the three
  where I went further and checked actual entity data/schema).
- Only `ingestion/liquidations.py` (Aave) is actually wired into the app
  right now - everything else here is unused reference data.
