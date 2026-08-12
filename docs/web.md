# apps/web — frontend

Next.js 16 App Router frontend: dashboard, vault detail pages, protocol
health views, strategy views, activity log, and wallet/faucet integration.

## Routes

- **`app/page.tsx`** — public marketing landing page
  (`components/Landing/*`), no dashboard chrome.
- **`app/dashboard/layout.tsx`** — wraps everything under `/dashboard` in
  `AppShell` (sidebar/topbar), nav config in
  `components/Layouts/nav.config.ts` (Overview, Vault, Protocols, Strategies
  under "Monitor"; Activity under "Log").
  - `/dashboard` — portfolio overview (`PortfolioSummary`, `YourPositions`,
    `MyProtocols`, `EventFeed`).
  - `/dashboard/vault` and `/dashboard/vault/[slug]` — vault picker table
    and detail view.
  - `/dashboard/protocols` and `/dashboard/protocols/[protocols]` — protocol
    list and detail.
  - `/dashboard/strategies` and `/dashboard/strategies/[id]` — strategy list
    (grouped by protocol) and detail.
  - `/dashboard/activity` — tabbed "Log" (scoring/trigger/execution audit
    trail) vs "Transactions" (on-chain tx list).
- **`app/protocols/*`** and **`app/vault/[slug]`** — public
  (non-dashboard-chrome) mirrors of the same protocol/vault views, rendering
  the identical `ProtocolsView`/`ProtocolDetailView`/`VaultDetailView`
  components with a different `basePath` — the two surfaces share one
  implementation, so they can't drift apart.
- **`app/debug/page.tsx`** and **`app/debug/ponder/page.tsx`** — a generic
  contract read/write console and a raw Ponder GraphQL query dump. Neither
  is linked from nav; local-dev tools only.

## Data layer: three separate sources, and it matters which

This is the part of the app most likely to surprise someone new to it —
different pages get their data completely different ways, and the folder
structure alone doesn't make that obvious.

### 1. Live on-chain data, via Ponder's GraphQL API (`lib/ponder/`)

`lib/ponder/client.ts` wraps a `graphql-request` client against
`NEXT_PUBLIC_PONDER_URL` (default `http://localhost:42069`), typed via
`lib/ponder/generated/{sdk,types}.ts` — generated (`pnpm ponder:codegen`)
from `.graphql` operation files in `lib/ponder/operations/` against
`apps/ponder`'s indexer schema (see [`ponder.md`](./ponder.md)).

Used by `app/api/vaults/route.ts` (list) and
`app/api/vault/[slug]/route.ts` (detail), mapped into app-shaped types via
`lib/ponder/mappers/vaultSummary.ts` / `vaultData.ts`. **These mappers are
explicitly, deliberately partial** — most numeric vault fields (APY, TVL,
position, allocation, history, risk checks) are hardcoded to
`NaN`/`null`/empty, with comments noting they're "left empty until wallet
reads / protocol correlation / price data is wired up." **Don't assume the
vault pages show real numbers for anything beyond identity fields (name,
symbol, asset, adapters) — by the code's own admission, most of them
aren't wired yet.**

### 2. A separate Postgres DB, via Drizzle ORM (`db/`)

`db/client.ts` opens a `pg` Pool against `DATABASE_URL` — **the same
database `apps/api` (the Python scoring service) writes to** (see
[`api.md`](./api.md)). Both apps' `db/schema`/`db/models` comments are
explicit that **`apps/api/db/models/*.py` (Python) is the DDL source of
truth**; the Drizzle schema here (`db/schema/{protocols,healthScores,
strategies,triggers,userTriggers}.ts`) hand-mirrors it for typed queries
only — it does not drive migrations, and nothing keeps the two in sync
automatically if one changes.

`app/api/protocols/route.ts`, `app/api/protocols/[id]/route.ts`, and
`app/api/strategies/route.ts` query this DB directly — protocols, 14-day
health-score history, triggers, and strategies, joined at read time.

### 3. A static in-memory `SEED` object (`seed/index.ts`)

`app/api/overview/route.ts`, `app/api/activity/route.ts`, and
`app/api/transactions/route.ts` just return `SEED.overview` /
`.activity` / `.transactions` directly — pure mock data, no DB or chain
involved anywhere in the request path.

### The seeding bridge: `scripts/seed-db.ts`

Reads `seed/protocol-detail/*.json` (one file per protocol) and upserts
into the `protocols` table, generates a deterministic 14-day health-score
walk into `healthScores`, seeds `triggers` from `SEED.overview.events`, and
upserts strategy data into `strategies`. Its own header comment states the
consequence plainly: this script is **the only place** the data
`/api/protocols/[id]` actually serves comes from — there's no live pipeline
from `apps/api`'s real scoring output into this table yet (see
[`api.md`](./api.md) for why: no scheduler, and nothing currently pushes
scores anywhere automatically).

**A subtlety worth flagging**: `SEED.protocols` (from `seed/protocols.json`)
and `SEED.strategies` (from `seed/strategies.json`) are exported from
`seed/index.ts`, but as of this doc, **no API route reads them directly
anymore** — `/api/protocols` and `/api/strategies` both hit Postgres
instead. Their only remaining live consumer is `scripts/seed-db.ts` itself
(for score/icon lookups) — and, separately, the **Solidity side**:
`apps/contracts/script/admin/RegisterProtocolsFromSeed.s.sol` and
`script/lib/StrategySeedReader.sol` read `seed/protocols.json` /
`seed/strategies.json` directly off disk (`../web/seed/...`) as their own
canonical protocol/strategy list — a real cross-app dependency, joined only
by a relative filesystem path, not a package or API boundary. Editing those
two JSON files affects both what gets registered on-chain and what
`seed-db.ts` writes to Postgres.

## Wallet + Faucet (`components/Wallet/`)

Uses **thirdweb** (`thirdweb/react`), not wagmi/viem directly.
`lib/thirdweb-client.ts` builds the client from
`NEXT_PUBLIC_THIRDWEB_CLIENT_ID`; unset, it exports `null` and every
consumer degrades gracefully (disabled connect button, disabled faucet)
rather than crashing. `lib/chains.ts` defines exactly three supported
chains — local anvil (`31337`), Base mainnet (`8453`), Base Sepolia
(`84532`) — and `ConnectWallet.tsx` hardcodes Base Sepolia as the default.

`FaucetModal.tsx` + `hooks/useFaucet.ts` read the deployed `Faucet` contract
for chain `84532` out of `lib/deployedContracts.ts`, cross-reference
`lib/testTokens.ts` against the _live_ asset addresses from `/api/vaults`
so only tokens actually backing a deployed vault are offered (`token.json`
accumulates hundreds of entries across every historical redeploy — most
aren't relevant to what's currently live). Per-token cooldown is read via
`claimableAt(address,address[])`. **Claiming calls `claimMany(address[])`
in one transaction**, not per-token `mint()` calls — the batched design
matches `Faucet.sol`'s own claim-and-forward-in-one-tx model, see
[`../apps/contracts/documentation/faucet.md`](../apps/contracts/documentation/faucet.md).
Result events (`Claimed`/`Skipped`) are parsed off the receipt and reported
per-token through a toast/job-tray UI.

## Key UI areas

- **`components/Vault/`** — `VaultsColumns.tsx` (TanStack Table columns:
  icon+name+subtitle, APY, TVL, fee), `VaultsFilterBar.tsx`/
  `VaultsFilterDialog.tsx` (type/chain/search + an advanced panel),
  `vaultFilters.ts` (central filter predicates, plus two _derived_ notions
  with no backing on-chain field: `vaultKindOf()` sniffed from a string, and
  `aggressivenessOf()` derived from risk-flag count — there's no explicit
  risk-tier field anywhere upstream). `TokenIcon.tsx` renders per-symbol
  icons from a hardcoded CoinGecko CDN map, falling back to a generated
  mono-letter badge.
- **`components/Health/`** — shared score-display primitives
  (`ScoreBadge`/`ScoreCell`, `BandLabel`, `DeltaCell`) reused across
  Overview/Protocols/Strategies. All colors resolve through
  `config/bands.config.ts` — its own header comment calls it "the ONLY
  place status color is allowed," and status renders only as thin
  rules/labels/deltas, never fills.
- **`components/Protocol/`** — `ProtocolsView.tsx` (list) and
  `ProtocolDetailView.tsx` (detail, structured in three depth tiers per its
  own comment: GLANCE → SCAN → DEEP), backed by the Postgres-sourced
  `/api/protocols` routes.
- **`components/Strategy/`** — strategy list grouped by protocol
  (permanently-expanded parent/sub-rows) and a per-strategy detail view
  (paused/retired state, fees, weights, addresses).
- **`components/Activity/`** — `ActivityTimeline` (staged audit-trail log:
  trigger → simulation → submission → gas/retries → outcome, expandable per
  entry) and `TransactionsList` (flatter on-chain tx list), both
  TanStack-Table-driven.

## Config

- **`config/table.config.ts`** — shared TanStack Table layout constants
  (grid-template-columns per table type, row height for
  `@tanstack/react-virtual` virtualization, overscan).
- **`config/bands.config.ts`** — the single source of health-score bands
  (HOLD ≥80, REDUCE 25% ≥60, REDUCE 50% ≥40, EXIT below) and their colors,
  matching the action names used elsewhere (`hold`/`reduce_25`/
  `reduce_50`/`exit`).

## Scripts (`apps/web/scripts/`)

- **`sync-contracts.ts`** (`pnpm sync-contracts`) — reads
  `apps/contracts/data/<chainId>/deployedContracts.json` + matching ABI
  artifacts from `apps/contracts/out/`, emits `lib/deployedContracts.ts`.
  Run automatically by `apps/contracts/deploy.sh`. See the caveat in
  [`../apps/contracts/DEPLOYMENT.md`](../apps/contracts/DEPLOYMENT.md#where-addresses-land)
  about per-instance bulk-deploy aliases breaking this script if run
  against a manifest containing them.
- **`sync-test-tokens.ts`** (`pnpm sync-test-tokens`) — reads
  `apps/contracts/data/<chainId>/token.json`, emits `lib/testTokens.ts`;
  skips malformed/legacy entries missing a token address (the schema has
  drifted across eras of that file).
- **`ponder-codegen.ts`** (`pnpm ponder:codegen`) — regenerates
  `lib/ponder/generated/{sdk,types}.ts` from a running Ponder instance's
  `/graphql` endpoint.
- **`seed-db.ts`** (`pnpm seed:db`) — see "The seeding bridge" above.

## Things that look unfinished or vestigial — flagged, not silently ignored

- **`@x402/core`, `@x402/evm`, `@x402/extensions`, `@x402/svm`** are
  dependencies in `package.json` with **zero actual imports anywhere in
  `apps/web`**. The only "x402" trace in the codebase is a cosmetic
  `x402ScanUrl` field on activity-log entries pointing at a fake
  `x402scan.com` URL. Don't treat these as "the payment layer" — nothing
  currently uses them.
- **`SEED.protocols`/`SEED.strategies`/`SEED.vaultList`** are exported but
  dead from the live app's perspective (see above) — only
  `scripts/seed-db.ts` still reads the first two, and nothing reads
  `vaultList` at all since `/api/vaults` moved to Ponder.
- **Vault numeric fields are mostly placeholder.** See the Ponder mapper
  note above — this is the single most important caveat for anyone building
  against `/api/vaults` or `/api/vault/[slug]`.
