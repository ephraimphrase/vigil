# Deployment guide

Covers `VigilVault`/`VaultFactory`/`HealthOracle`/`VigilZapRouter` — the core
Vigil stack. `src/beefy_strategies/` and `src/adapter/BeefyStrategyAdapter.sol`
are **not** covered here: they need a `IStrategyFactory` + swapper
implementation that doesn't exist in this repo yet, so nothing in that
directory can be deployed on any chain today.

## Where addresses land

Every deploy script inherits `DeployRegistrar` and writes into
`data/<chainId>/deployedContracts.json` (merge-in-place, one entry per
contract name). `apps/web/scripts/sync-contracts.ts` reads that file, pairs
each address with its ABI from `out/`, and generates
`apps/web/lib/deployedContracts.ts` — the typed source the frontend actually
imports. `deploy.sh` runs the sync automatically; if you run a script by
hand, re-run the sync yourself afterward (see below).

## Prerequisites

```
cp .env.example .env
```

Fill in `RPC_URL` / `DEPLOYER_KEY` at minimum. `.env.example` documents every
variable inline — read it before asking "what do I set this to."

## Local development

```
./deploy.sh
```

Starts anvil if nothing's listening on `RPC_URL` (or forks Base if
`BASE_RPC_URL` is set), then runs the full sequence: WETH9 → seed DeFi
tokens → generate any missing role keys → `DeployAll.s.sol` (HealthOracle →
VaultFactory → VigilVault → VigilZapRouter, wired together in one script,
with a `MockSwapRouter` standing in for Uniswap) → sync into `apps/web`.
This is the only path that deploys the _entire_ stack in one shot, because
it's the only chain where a mock swap router is allowed.

`./deploy.sh --fresh` wipes anvil and the local Blockscout index for a clean
slate.

## Base Sepolia (real testnet)

**`./deploy.sh` will get partway through and then revert here** —
`VigilZapRouter`'s constructor needs a real `ISwapRouter02`, and
`DeployAll.s.sol` deliberately refuses to guess one on a non-local chain
(`script/deploy/DeployAll.s.sol`'s `_resolveSwapRouter()`). Deploy the
pieces that don't depend on it individually instead of running `deploy.sh`
wholesale:

```
set -a; source .env; set +a

# WETH9 - no deploy needed, registers Base's real OP-stack predeploy
# (0x4200...0006) into deployedContracts.json instead.
forge script script/deploy/DeployWETH.s.sol --rpc-url "$RPC_URL" --broadcast --private-key "$DEPLOYER_KEY"

# HealthOracle - reads ORACLE_ADMIN/SCORER/GUARDIAN from .env.
forge script script/deploy/DeployHealthOracle.s.sol --rpc-url "$RPC_URL" --broadcast --private-key "$DEPLOYER_KEY"

# Register every protocol in apps/web/seed/protocols.json - required once
# before setScore()/scoreOf() work for any of them (NotRegistered otherwise).
ORACLE_ADDRESS=<HealthOracle address from above> \
forge script script/admin/RegisterProtocolsFromSeed.s.sol --rpc-url "$RPC_URL" --broadcast --private-key "$DEPLOYER_KEY"

# VaultFactory + VigilVault - unlike VigilZapRouter, neither touches
# Uniswap, so this works today without a SWAP_ROUTER_ADDRESS. Picks up
# WETH9/HealthOracle from deployedContracts.json automatically; reuses an
# existing VaultFactory if one's already registered.
forge script script/deploy/DeployVault.s.sol --rpc-url "$RPC_URL" --broadcast --private-key "$DEPLOYER_KEY"
```

`SeedTokens.s.sol` also no-ops on any non-local chain (real DeFi tokens
already exist on Base Sepolia's mainnet-adjacent contracts where they exist
at all) — skip it here.

`VigilZapRouter` is the one piece still blocked — it needs a real
`SwapRouter02` address, which `DeployAll.s.sol` refuses to guess on a
non-local chain. Once one's sourced, set `SWAP_ROUTER_ADDRESS` and deploy it
directly:

```
SWAP_ROUTER_ADDRESS=<real Base Sepolia SwapRouter02> \
forge script script/deploy/DeployAll.s.sol --rpc-url "$RPC_URL" --broadcast --private-key "$DEPLOYER_KEY"
```

(`DeployAll.s.sol` re-running is safe for the pieces above — `VaultFactory`
gets reused via the same `.VaultFactory` lookup, though it will still try
`factory.createVault(...)` again and revert with `VaultAlreadyExists` if a
vault for that asset already exists; run `DeployVault.s.sol` and
`DeployAll.s.sol` as alternatives, not both.)

**Current live state on Base Sepolia** (`data/84532/deployedContracts.json`):
`HealthOracle` and `WETH9` only — `VaultFactory`/`VigilVault` are ready to
deploy via `DeployVault.s.sol` above but haven't been run for real yet;
`VigilZapRouter` stays blocked on `SWAP_ROUTER_ADDRESS`.

After any manual (non-`deploy.sh`) run, sync the frontend yourself:

```
(cd ../web && npx tsx scripts/sync-contracts.ts)
```

## Base mainnet

Not done, and shouldn't be attempted casually — real funds, real
irreversibility. Same script set as Base Sepolia applies once you're
actually ready; get a real `SwapRouter02` address and a real audited
comfort level before broadcasting anything with `--broadcast` against
`https://mainnet.base.org`.

## Verifying on Etherscan

```
./script/shell/verify.sh
```

Verifies every contract currently in `data/<chainId>/deployedContracts.json`
via `forge verify-contract --guess-constructor-args`, using the Etherscan V2
API (one `ETHERSCAN_API_KEY` covers Base and Base Sepolia both, no separate
Basescan key). Refuses to run if `RPC_URL` points at localhost — nothing
public to verify against.

## Role keys

```
./script/shell/generate-roles.sh
```

Fills in any of `DEPLOYER_KEY` / `ORACLE_ADMIN` / `ORACLE_SCORER` /
`ORACLE_GUARDIAN` / `VAULT_KEEPER` not already set in `.env`, via
`cast wallet new`. Private keys are written one-per-file under `.keys/`
(gitignored) with a label describing what each one controls.
`DEPLOYER_KEY` gets auto-funded on local anvil only; on any other chain
you fund it yourself (faucet, transfer).

In production these five MUST be distinct addresses — collapsing them
defeats the role-separation `HealthOracle.sol`'s own threat model is built
around (the scorer key is the least-protected one in the system).
`deploy.sh` runs this automatically for local dev.
