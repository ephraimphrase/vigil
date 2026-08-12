# VaultFactory + VigilVault (`src/vault/`)

## VaultFactory

Deploys one `VigilVault` per underlying asset and remembers the mapping.
That's the entire contract — no access control of its own:

```solidity
function createVault(
    IERC20 asset, VaultKind kind, HealthOracle oracle,
    address admin, address keeper, address guardian,
    string name, string symbol
) external returns (VigilVault vault)
```

- Reverts `VaultAlreadyExists(asset)` if `vaultByAsset[asset]` is already
  set — **one canonical vault per asset**, enforced here so there's never
  ambiguity over which vault a given asset's deposits should route to.
- `vaults` (array) and `vaultByAsset` (mapping) are both public, giving two
  ways to enumerate: `vaultCount()`/`vaults(i)` for "all vaults in creation
  order," `vaultByAsset(token)` for "the vault for this specific token, if
  any."
- A factory is stateless enough to be reused across every vault ever
  created on a chain — deploy scripts resolve an existing factory from
  `deployedContracts.json` before deploying a new one (see
  `VaultResolvers._resolveFactory()`), so you don't end up with orphaned
  duplicate factories each holding a disjoint subset of vaults.

## VigilVault

An ERC-4626 vault (standard share-based deposit/withdraw accounting via
OpenZeppelin) that splits its holdings across a whitelisted set of
[`IVigilProtocolAdapter`](./adapters.md) instances, weighted by each
adapter's live `HealthOracle` score. Idle balance (not yet swept into any
adapter) always counts as zero-risk weight in the pool — a healthy vault
gradually drains toward whichever protocols the scorer currently trusts
most, and idle cash is always available to be pulled from the moment a
score turns bad.

### Roles

- **`DEFAULT_ADMIN_ROLE`** — `addAdapter`/`removeAdapter`. The only role
  that decides which venues the vault is even allowed to touch; `KEEPER_ROLE`
  and `GUARDIAN_ROLE` can only move funds among adapters an admin already
  approved.
- **`KEEPER_ROLE`** — `rebalance()` only.
- **`GUARDIAN_ROLE`** — `emergencyEvacuate(adapter)` only: pull one
  adapter's entire position back to idle _and_ drop it from rotation,
  immediately, without waiting for the scorer to catch up and a keeper to
  run a full rebalance. One-directional, same philosophy as
  `HealthOracle.emergencyZero`.

### Adding an adapter

```solidity
function addAdapter(IVigilProtocolAdapter adapter) external onlyRole(DEFAULT_ADMIN_ROLE)
```

Checks, in order: not already added, under `MAX_ADAPTERS` (8 — bounds the
gas cost of `rebalance()`/`totalAssets()`, both O(adapters.length)),
`adapter.asset() == asset()` (an adapter for the wrong token can never be
wired in), and no other active adapter already shares this one's
`protocolId` (`DuplicateProtocol` — one live strategy per protocol per
vault, though the same protocol _can_ have multiple deployed-but-unwired
`MockStrategyAdapter` instances sitting around, see
[`adapters.md`](./adapters.md)).

### Removing an adapter

Two ways, both admin/guardian-gated (never keeper), both terminal for that
adapter instance:

- **`removeAdapter`** (admin) — calls `adapter.retire(0)`, which pulls the
  full position back to the vault's idle balance and marks the adapter
  permanently closed to further deposits. Ordinary decommissioning.
- **`emergencyEvacuate`** (guardian) — calls `adapter.withdrawAll(0)`
  instead of `retire`, same net effect (funds back to idle, adapter dropped
  from `adapters`/`isAdapter`) but framed as the "get funds out _now_, ask
  questions later" path. Both drop the adapter from the rotation array in
  the same transaction as pulling funds — leaving a de-weighted-but-still-
  routable adapter around would let the very next `rebalance()` immediately
  redeploy idle balance straight back into whatever this call was meant to
  exit.

### Weighting and `rebalance()`

```solidity
function targetWeights() public view returns (uint256[] weights, uint256 totalWeight)
```

Each adapter's weight is its raw `HealthOracle` score — **0** if the score
was never written, or if it's older than `oracle.stalenessWindow()`. Same
"silence reads as exit" convention the oracle itself documents.

```solidity
function rebalance() external onlyRole(KEEPER_ROLE) nonReentrant
```

1. Computes `pool` = idle vault balance + every adapter's current
   `totalAssets()`.
2. **No-ops if `pool == 0`.** This trips people up when testing: funding an
   adapter's yield-backing `reserve` (`MockStrategyAdapter.fundReserve()`)
   does **not** count toward `pool` — only `principal` does, which only
   grows via an actual `deposit()` call from the vault. A vault nobody has
   ever deposited real assets into has `pool == 0` forever, no matter how
   many adapters it has or how well-funded their reserves are.
3. Computes each adapter's `target = pool * weight / totalWeight` (all
   targets collapse to 0 if `totalWeight == 0` — i.e. every adapter is
   stale/unregistered — which just pulls everything back to idle, the safe
   default when the oracle has gone quiet).
4. **Withdraws every overweight adapter first**, then deposits into
   underweight ones from whatever's now idle. This ordering matters: it
   guarantees the vault has idle balance on hand to fund the underweight
   leg, rather than that leg being starved by a withdraw phase still in
   flight. A protocol-side liquidity cap can leave a withdraw short of what
   was requested — that's expected to converge further on the _next_
   `rebalance()` call once liquidity frees up, not to be forced through some
   other path in the same call.

### Standard ERC-4626 surface, with two overrides

- **`totalAssets()`** — idle balance + sum of every adapter's
  `totalAssets()`. This is what share price is computed against.
- **`_withdraw()`** — before the base ERC4626 logic runs, tops up idle
  balance if needed by draining adapters (in array order, via
  `_pullLiquidity`) until the shortfall for _this one withdrawal_ is
  covered. Not a proportional draw across all adapters — just "enough,
  fast," in whatever order they happen to be stored.

### `VaultKind`

`Single | LP | Basket`, set once at construction, matches the frontend's own
classification. **Only `Single` is real today** — `VaultFactory` never
deploys anything else, so an `LP`- or `Basket`-tagged vault (there currently
are none) would behave identically to any other `VigilVault` until a
genuinely distinct basket/LP contract exists. Don't read a non-`Single` kind
as meaning the vault has different mechanics; it doesn't, yet.
