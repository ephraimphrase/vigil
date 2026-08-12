# Vigil — documentation

Vigil is an autonomous protocol-risk-monitoring and consequence-execution
system: a set of on-chain vaults that automatically reallocate deposited
funds across DeFi protocols based on a live "health score" per protocol,
plus the offchain services that compute those scores and the frontend that
makes the whole thing visible and usable.

This folder is the monorepo-wide index. Each app has its own deeper
documentation linked below — start here, then follow the link for whichever
piece you're actually working on.

## The apps

| App                                    | What it is                                                                                                                                                                                                                                                                                        | Docs                                                                                                                                                                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/contracts`                       | The on-chain system: vaults, the health-score oracle, adapters into yield venues, testnet token/faucet infrastructure. Foundry project.                                                                                                                                                           | [`apps/contracts/documentation/`](../apps/contracts/documentation/README.md) (contract-by-contract) + [`apps/contracts/DEPLOYMENT.md`](../apps/contracts/DEPLOYMENT.md) (how to run the deploy scripts) |
| `apps/ponder`                          | Indexes every contract event into Postgres, serves it over GraphQL. This is how the frontend discovers vaults/adapters without polling the chain or hardcoding addresses.                                                                                                                         | [`ponder.md`](./ponder.md)                                                                                                                                                                              |
| `apps/web`                             | The Next.js frontend — dashboard, vault detail pages, protocol health views, wallet/faucet integration.                                                                                                                                                                                           | [`web.md`](./web.md)                                                                                                                                                                                    |
| `apps/api`                             | Python/FastAPI backend — protocol data ingestion and health-score computation. Does **not** write on-chain itself, see below.                                                                                                                                                                     | [`api.md`](./api.md)                                                                                                                                                                                    |
| KeeperHub (external, not in this repo) | A scheduled workflow (15 min) that triggers `apps/api`'s ingest sweep, reads the resulting scores straight out of Postgres, and is the thing that actually calls `HealthOracle.setScore()` and `VigilVault.rebalance()` on-chain. Exported for reference at root `vigil-work-flow.workflow.json`. | [`keeperhub.md`](./keeperhub.md)                                                                                                                                                                        |
| `packages/*`                           | Shared config (`eslint-config`, `typescript-config`, `jest-config`) and a shared UI component library (`ui`), consumed via workspace references (`@repo/...`).                                                                                                                                    | — (thin wrappers, see each package's own `package.json`)                                                                                                                                                |

## How data flows end to end

```
apps/api (scoring)  ──writes health_scores──▶  Postgres
                                                    │
                                                    │ SQL read, every 15 min
                                                    ▼
                                              KeeperHub (external)
                                                    │
                                                    │ HealthOracle.setScore()
                                                    ▼         (on-chain)
                                          VigilVault.rebalance()
                                          (KeeperHub-triggered, moves
                                           funds across adapters)
                                                    │
                                                    │ emits events
                                                    ▼
                                          apps/ponder (indexes events
                                          + live contract reads into Postgres)
                                                    │
                                                    │ GraphQL
                                                    ▼
                                             apps/web (dashboard,
                                             vault pages, wallet/faucet UI)
```

The middle step is easy to miss: **nothing in this repo's code calls
`HealthOracle.setScore()` or triggers `VigilVault.rebalance()`.** Both are
KeeperHub actions, configured outside this codebase. See
[`keeperhub.md`](./keeperhub.md) before assuming that loop is either fully
automated-in-repo or entirely missing — it's real, just external.

Two things worth internalizing up front, since they trip up anyone new to
this repo:

1. **`apps/contracts/data/<chainId>/deployedContracts.json` is the seam
   between the contracts and everything downstream.** Every deploy script
   writes into it; `apps/ponder`'s config and `apps/web`'s
   `sync-contracts.ts` both read out of it. If you redeploy a contract and
   something downstream looks stale, this file (and whether it's actually
   current) is the first thing to check.
2. **Not everything documented in the contracts layer is deployed for
   real.** `src/beefy_strategies/` (real protocol integrations) can't be
   deployed today — missing infrastructure, see
   [`apps/contracts/documentation/adapters.md`](../apps/contracts/documentation/adapters.md).
   Every "real protocol" adapter you'll actually find on-chain right now is
   a `MockStrategyAdapter` labeled with that protocol's name.
3. **KeeperHub's contract addresses are hardcoded in the exported workflow,
   not read from `deployedContracts.json`.** Unlike `apps/ponder` and
   `apps/web`'s sync scripts, redeploying `HealthOracle` or `VaultFactory`
   means manually updating KeeperHub's workflow too — nothing does that
   automatically. See [`keeperhub.md`](./keeperhub.md#contract-addresses-baked-into-the-exported-workflow).

## Where things actually run

Local dev, from the repo root:

```
pnpm install
pnpm dev          # turbo runs `dev` across every app in parallel
```

Or per-app, via turbo filters (`pnpm --filter web dev`, `pnpm --filter
ponder dev`, etc.) — see each app's own docs for what env vars it needs
first.
