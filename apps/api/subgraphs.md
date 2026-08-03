# Subgraph research — one per supported protocol

Candidate [The Graph](https://thegraph.com) subgraph ids for every protocol in
`apps/web/seed/protocol-detail/`, for use with `providers/thegraph.py`
(`query(subgraph_id, graphql_query, variables)` against
`https://gateway.thegraph.com/api/subgraphs/id/{subgraph_id}`).

Subgraph ids are opaque hashes - easy to get subtly wrong. Where an id
couldn't be verified against an official source (protocol docs, or the
protocol team's own GitHub org), that's called out rather than guessed.
None of these are wired into `ingestion/` yet - each would need its own
hand-written GraphQL query against that subgraph's schema, the same way
`whale_token_address` etc. are per-protocol config on `Protocol`.

| Protocol | Chain | Subgraph ID | Confidence / Source |
|---|---|---|---|
| Aave | ethereum | `HB1Z2EAw4rtPRYVb2Nz8QGFLHCpym6ByBX6vbCViuE9F` | Good — matches Aave's own `protocol-subgraphs` repo |
| Compound | ethereum | `AwoxEZbiWLvv6e3QdvdMZw4WDURdGbvPfHmZRc8Dpfz9` | Community (Messari), not Compound-team-published |
| Uniswap | ethereum | `A3Np3RQbaBA6oKJgiwDJeo5T3zrYfGHPWFYayMwtNDum` | From Uniswap's own docs — but their docs explicitly warn it's "not an official deployment, may not be actively maintained" |
| Curve | ethereum | `GAGwGKc4ArNKKq9eFTcwgd1UGymvqhTier9Npqo1YvZB` | ⚠️ Both candidates found are marked deprecated, last indexed 3-4 years ago |
| Sky (MakerDAO) | ethereum | none found | Only legacy hosted-service URLs (`protofire/makerdao`), no live Graph Network id confirmed |
| Lido | ethereum | `HXfMc1jPHfFQoccWd7VMv66km75FoxVHDMvsJj5vG5vf` | Good — confirmed on Lido's own docs (`docs.lido.fi/integrations/subgraph`) |
| Balancer | ethereum | `4rixbLvpuBCwXTJSwyAzQgsLR8KprnyMfyCuXT8Fj5cd` | Moderate — this is "Balancer V3" but couldn't fully confirm it's the mainnet deployment vs. another chain |
| Morpho | ethereum | `8Lz789DP5VKLXumTMTgygjU2xtuzx8AhbaacgN5PYCAs` | ⚠️ Still queryable, but Morpho's own subgraph repo has been unmaintained/deprecated since March 2025 |
| Pendle | ethereum | `ExXGU3ub2nrT5stPk5cH4hSk2qunJcMcP8eX5GAhrZhe` | Good — published under the `pendle-finance` org's own repo |
| Silo Finance | ethereum | `GTEyHhRmhRRJkQfrDWsapcZ8sBKAka4GFej6gn3BpJNq` | Good — Silo's own dev docs reference their subgraphs |
| Tokemak | ethereum | none found | No subgraph exists; only an unrelated "Tokamak Network" bridge subgraph came up |
| GMX | arbitrum | `DiR5cWwB3pwXXQWWdus7fDLR2mnFRQLiBFsVmHAH9VAs` | Community (Messari); several other unofficial forks also exist |
| Velodrome | optimism | `7tA4PY1VmbycJeoVtn2mjQK4NbozgwTuZgrxDTxzEDL1` | ⚠️ Community only — Velodrome's own indexer is now Envio HyperIndex, not The Graph |
| Venus | bnb-chain | `CwswJ7sfENafqgAYU1upn3hQgoEV2CXXRZRJ7XtgJrKG` | Moderate — Venus does officially maintain subgraphs (`VenusProtocol/subgraphs`); this id matched by name in Explorer but wasn't cross-checked against their docs page content directly |
| Stargate | multichain | none single — per-chain only (e.g. Polygon `SitmxEcPXXwo5cFK8Y2FSMZNZNQ4gXcGdWBDqo3A7K6`, BSC `6sRx6JNkjz66id39jCK3GMiVnPVuyuv2ntwQVpDzmjRF`) | No Ethereum-mainnet one surfaced; would need to pick per destination chain |
| Beefy | multichain | none current | Beefy's actual official data source is their own REST API (`docs.beefy.finance/developer-documentation/beefy-api`), not a subgraph. Only subgraph found (BSC, Messari) uses an old hosted-service-style id, likely dead |
| Abracadabra | ethereum | none confirmed for ethereum specifically | Only Arbitrum (`GnroBYmeLLtKuHNyTNS38hzKki5n4CWaHeaMRqZpU4cr`, community) has a confirmed live id; Ethereum reference was hosted-service (deprecated) |
| Bunni | ethereum | `5NFnHtgpdzB3JhVyiKQgnV9dZsewqJtX5HZfAT9Kg66r` | Moderate — clean "Bunni v2 Mainnet" match, not independently confirmed via Bunni's own docs |
| ICHI | ethereum | none found | No subgraph surfaced at all |
| BaseSwap | base | `BWHCfpXMHFDx3u4E14hEwv4ST7SUyN89FKJ2RjzWKgA9` | Community, unverified against BaseSwap's own docs |
| Kodiak | berachain | `2YL8gVAQtgkP8kW8KcM7Yv86GUwJpkSWa7dvNoVHs5yX` | Moderate — Kodiak's own docs (`documentation.kodiak.finance`) confirm they use a subgraph, but they also offer Goldsky as an alternative and the exact id wasn't cross-checked against their docs page |
| Shadow Exchange | sonic | `HGyx7TCqgbWieay5enLiRjshWve9TjHwiug3m66pmLGR` | Moderate — Shadow's own docs (`docs.shadow.xyz/product-guide/subgraphs`) confirm a subgraph exists, name (`shadow-core`) matches |

## Takeaways

- 16 of 22 protocols have a plausible id; only ~5 (Aave, Lido, Pendle, Silo,
  Kodiak/Shadow via their own docs) are backed by something stronger than
  "found it in Graph Explorer search and the name matches."
- Sky, Tokemak, and ICHI have no subgraph at all.
- Velodrome and Beefy have moved to other indexing services entirely
  (Envio HyperIndex and a custom REST API, respectively) - a Graph-only
  strategy misses them.
- Stargate's subgraphs are per-chain, with no Ethereum-mainnet deployment
  found; `chain: "multichain"` protocols don't map to a single id.
