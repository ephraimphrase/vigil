# Adapters: IVigilProtocolAdapter, MockStrategyAdapter, BeefyStrategyAdapter

## IVigilProtocolAdapter (`src/interface/IVigilProtocolAdapter.sol`)

The uniform surface `VigilVault` uses to route capital into a single
external yield venue. One adapter == one venue == one strategy instance —
the adapter is the only address the underlying strategy trusts as its
`vault`.

**Lifecycle**, strictly one-way after the middle state:

```
unpaused, not retired  →  paused                →  retired
(deposits + withdrawals   (deposits rejected,       (terminal: position
 both allowed)             withdrawals still         fully unwound,
                           allowed — reversible)      deposits refused forever)
```

Key contract-level invariants every implementation must uphold (from the
interface's own doc comments, not just convention):

- `asset()` **must** equal the vault's own `asset()` — enforced by the vault
  at `addAdapter()` time (`AssetMismatch` otherwise), not just documented.
- `maxWithdraw()` must reflect real venue liquidity, not the full position —
  "returning `totalAssets()` unconditionally is a bug, not a simplification."
- `previewWithdrawAll()` may be below `totalAssets()` where exiting incurs
  fees or slippage.
- `deposit`/`withdraw` are vault-only (`OnlyVault`); the vault transfers
  `amount` of `asset()` to the adapter first, _then_ calls `deposit()` to
  put it to work — the adapter never pulls funds itself.
- `retire()` is one-way. Whatever calls it **must** also drop the adapter
  from the vault's active rotation in the same transaction — a retired
  adapter left routable would revert every future `rebalance()` leg that
  tries to touch it. `VigilVault.removeAdapter`/`emergencyEvacuate` both do
  this correctly; don't call `retire()` any other way.

## MockStrategyAdapter (`src/adapter/MockStrategyAdapter.sol`)

**The only adapter implementation actually deployable today.** A flat
stand-in for any strategy with no real Base Sepolia deployment — implements
`IVigilProtocolAdapter` directly, with no wrapped external strategy
contract underneath (there's nothing real to wrap).

### Accounting model

```solidity
uint256 public principal;  // grows via deposit(), shrinks via withdraw()
uint256 public reserve;    // pre-funded backing for reported yield
```

`totalAssets() = principal + _pendingAccrued()`, where `_pendingAccrued()`
computes a linear APY accrual (`apyBps` set at construction, time-weighted
since the last principal change) **capped by however much `reserve` is
left**. The contract's own comment states the invariant plainly: "every
unit of reported yield is real `underlying` actually held by this contract...
`totalAssets()` can never exceed principal + whatever reserve is left to
back it, and `withdraw()` always transfers exactly what it reports, never
more." This is what makes it a credible stand-in rather than a pure mock
that could report unbacked numbers — real `SeedToken`/`WETH9` balances back
every reported gain.

**`fundReserve(uint256 amount)` only tops up `reserve`, never `principal`.**
This is the single most common source of confusion when testing
`rebalance()`: deploying a fresh vault + adapters via
`DeployManyMockVaults.s.sol` calls `fundReserve()` for each adapter (backing
the yield they'll report), but that alone leaves `principal == 0`
everywhere — meaning `totalAssets() == 0` for every adapter and the vault's
`rebalance()` has nothing to move (see
[`vaults.md`](./vaults.md#weighting-and-rebalance)). `principal` only grows
once the vault actually receives a real ERC-4626 `deposit()` and pushes some
of it into an adapter.

### Deploying at scale: `DeployMockStrategyAdapters.s.sol` vs `DeployManyMockVaults.s.sol`

Two different scripts deploy `MockStrategyAdapter` instances, for two
different situations:

- **`DeployMockStrategyAdapters.s.sol`** — targets one already-deployed
  vault, deploys _every_ strategy in `apps/web/seed/strategies.json` (42
  entries) for individual inspectability, but only _wires in_ (calls
  `addAdapter`) the first one encountered per unique `protocolId` — multiple
  strategies sharing a protocol (curve has 8 variants, pendle 4, gmx 4, ...)
  is common in the seed data, but `VigilVault.addAdapter` rejects a second
  adapter for a protocol already whitelisted. `STRATEGIES_PER_VAULT` caps how
  many actually get _wired_ (default `MAX_ADAPTERS`, 8) and stops the batch
  loop early once that cap is hit, rather than deploying the full 42 just to
  wire a handful.
- **`DeployManyMockVaults.s.sol`** — deploys one vault _per token_ in a list,
  each with `STRATEGIES_PER_VAULT` (default 5) adapters, scanning forward
  through the seed strategy list from a rotating start index (`(vaultIndex *
n) % strategyLength`) so different vaults don't all end up with the exact
  same five protocols. Used for seeding many demo vaults in one run (e.g.
  "one vault per top-40-market-cap token").

Both fund each adapter's reserve with `RESERVE_PER_ADAPTER` (0.001 of the
vault's token) — either by wrapping native currency (`WRAP_NATIVE=true`,
only correct for a WETH-like asset) or by the broadcaster already holding
that balance (`WRAP_NATIVE=false` — for `SeedToken`s, mint it first via
`mint()`, see [`tokens.md`](./tokens.md)).

## BeefyStrategyAdapter (`src/adapter/BeefyStrategyAdapter.sol`) — not deployable yet

Wraps a real `Common/`-style Beefy strategy (from `src/beefy_strategies/`,
48 vendored strategy contracts across ~20 protocols) behind
`IVigilProtocolAdapter`. Unlike `MockStrategyAdapter`, this is meant for an
**actual** external protocol integration, not a stand-in.

**Cannot be deployed in this repo today.** Its constructor comment spells
out the required deploy order:

```
deploy the strategy's proxy uninitialized (deterministic address)
  → deploy this adapter with that address
  → initialize() the strategy with vault = address(adapter)
  → link()
  → VigilVault.addAdapter()
```

That first step needs an `IStrategyFactory` implementation (to deploy the
strategy proxy at a deterministic address ahead of the adapter) plus a token
swapper (for harvest-time reward-token conversion) — **neither exists in
this repo.** Until they do, every one of the 48 `beefy_strategies/`
contracts is source-only: it compiles, `forge build` produces artifacts for
it, but no deploy script can actually put one on-chain. This is why every
"real protocol" strategy in the current Base Sepolia deployment is actually
a `MockStrategyAdapter` labeled with that protocol's name/APY (e.g. an
adapter registered as `Aave_steth-0_aave` is a mock, not a real connection
to Aave) — see [`vaults.md`](./vaults.md) and `../DEPLOYMENT.md` for what's
actually live.
