# Ponder indexer (`apps/ponder`)

Indexes every Vigil contract event on Base Sepolia into Postgres and serves
it over GraphQL — this is how `apps/web` actually discovers vaults and their
live state, rather than reading `deployedContracts.json` or polling the
chain directly for lists.

## Config: `ponder.config.ts`

Reads `VaultFactory` and `HealthOracle` addresses **live** out of
`apps/contracts/data/84532/deployedContracts.json` at config-load time — no
manual address updates needed when the contracts are redeployed, as long as
that file is current. Two things are _not_ auto-updated and must be fixed
by hand after a `VaultFactory`/`HealthOracle` redeploy:

- `VAULT_FACTORY_START_BLOCK` / `HEALTH_ORACLE_START_BLOCK` — hardcoded
  block numbers (found via the deploy tx's receipt or a Basescan lookup) so
  indexing doesn't waste time scanning empty blocks from genesis. Stale
  (too early) is harmless; stale (too late, i.e. after the real redeploy
  block) means missed events.
- Nothing else — individual vault and adapter addresses are discovered
  dynamically, not hardcoded (see below).

### How vaults and adapters get discovered without hardcoding addresses

`VigilVault` instances: via Ponder's `factory()` helper, watching
`VaultFactory`'s own `VaultCreated` event and extracting the `vault` arg —
every vault ever created shows up automatically, no config change needed
per vault.

`StrategyAdapter` (`MockStrategyAdapter`/any future adapter) instances:
these aren't created by an on-chain factory contract (each is deployed
directly by a deploy script, then wired in via `VigilVault.addAdapter`), so
there's no factory-of-a-factory Ponder can point at (its `factory()` helper
doesn't chain a third level deep off an already-dynamic vault set). Instead,
`ponder.config.ts` resolves the current adapter set **once, at config-load
time**, via a real top-level `await`: it queries every discovered vault's
`AdapterAdded` logs directly (paginated in 2000-block chunks — the public
RPC caps `eth_getLogs` at that range per call) and passes the resulting
address list as `StrategyAdapter`'s static `address`.

**Practical consequence**: an adapter added while `ponder start` is already
running won't be picked up until the process restarts (`ponder dev` restarts
on every file save, so this is rarely noticed there; a production `ponder
start` needs a manual restart after adding adapters to an existing vault).

If zero adapters are found (a fresh chain with no vaults yet), the config
falls back to a single zero address rather than an empty array — Ponder
rejects an empty address array outright, and using the zero address just
means "watch nothing" without making the `StrategyAdapter` contract group's
TypeScript type conditionally optional (which would break event-name
inference for every `StrategyAdapter:*` handler).

## Schema (`ponder.schema.ts`)

Two kinds of tables:

- **Live state, upserted** — `vault` (one row per `VaultCreated`, written
  once and never updated — a vault's identity fields don't change) and
  `adapter` (one row per adapter, created from `AdapterAdded` then
  **refreshed with a live on-chain read** — `totalAssets()`, `paused()`,
  `retired()` — on every subsequent event touching that adapter, rather than
  derived by replaying event math client-side. This means `adapter.allocated`
  can never drift from on-chain truth even if an event handler had a bug in
  its math — it's always re-derived from a direct contract call).
- **Append-only event logs** — one table per contract event
  (`deposit`, `withdrawal`, `adapter_added`, `adapter_removed`, `rebalance`,
  `adapter_evacuated`, `protocol_registered`, `score_updated`,
  `emergency_zeroed`, `adapter_deposited`, `adapter_withdrawn`,
  `adapter_harvested`, `adapter_retired_event`). Every one of these is keyed
  by `"{txHash}-{logIndex}"`, not `txHash` alone — a single transaction can
  emit the same event type more than once (e.g. a batch operation), so the
  log's position within the tx is what's actually unique.

`vaultKind` is an on-chain enum with only `["Single", "LP"]` — Solidity's
`IVigilVault.VaultKind` has a third value (`Basket=2`), deliberately left
out here since no vault has ever been created with it. If a `Basket` vault
is ever created, the corresponding lookup in `src/index.ts`
(`VAULT_KIND_LABELS[2]`) is `undefined` and the insert **throws** — treated
as a real inconsistency to fix (extend the enum to 3 values) rather than
something to silently paper over.

## Event handlers (`src/index.ts`)

One `ponder.on("Contract:Event", ...)` handler per indexed event, each
writing into its matching table. Two worth calling out specifically:

- **`VaultFactory:VaultCreated`** — the event itself only carries
  `vault`/`asset`/`oracle`/`kind` addresses/enum, none of the human-readable
  metadata a UI wants. The handler does a `multicall` (`name`/`symbol` on
  both the vault itself and its underlying asset, plus the asset's
  `decimals`) at index time and stores the results directly on the `vault`
  row — so every downstream query gets that metadata for free, without a
  second round trip.
- **Adapter event handlers** — after inserting the append-only log row for
  whatever event fired, they also re-read the adapter's live state
  (`totalAssets`/`paused`/`retired`) and upsert the `adapter` table's row,
  keeping it always current rather than reconstructed from the log history.

## Running it

```
pnpm --filter ponder dev     # or: cd apps/ponder && pnpm dev
```

Needs `DATABASE_URL` (points at the same local Postgres `apps/web`'s
Drizzle setup uses, but under its own `ponder` Postgres _schema_ so it never
touches `apps/web`'s tables) and, optionally, `PONDER_RPC_URL_84532` (falls
back to the public `sepolia.base.org` if unset — see
`../apps/contracts/DEPLOYMENT.md`'s note on that RPC's reliability under
load). `ponder dev --schema ponder` for local development (hot-reloads on
file save); `ponder start --schema ponder` for a long-running instance.

`apps/web/lib/ponder/` holds the generated GraphQL client (`generated/sdk.ts`,
`generated/types.ts`, from Ponder's own GraphQL schema) plus hand-written
`mappers/` that shape Ponder's raw rows into whatever shape the frontend's
components actually expect — see [`web.md`](./web.md).
