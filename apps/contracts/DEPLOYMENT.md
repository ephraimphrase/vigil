# Deployment guide

Covers `VigilVault`/`VaultFactory`/`HealthOracle` — the core Vigil stack.
`src/beefy_strategies/` and `src/adapter/BeefyStrategyAdapter.sol` are
**not** covered here: they need a `IStrategyFactory` + swapper
implementation that doesn't exist in this repo yet, so nothing in that
directory can be deployed on any chain today. For protocols with no real
integration, `MockStrategyAdapter.sol` + `script/deploy/DeployMockStrategyAdapters.s.sol`
stand in instead — see that script's own doc comment.

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
VaultFactory → VigilVault) → sync into `apps/web`.

`./deploy.sh --fresh` wipes anvil and the local Blockscout index for a clean
slate.

## Base Sepolia (real testnet)

```
set -a; source .env; set +a

# WETH9 - no deploy needed, registers Base's real OP-stack predeploy
# (0x4200...0006) into deployedContracts.json instead.
forge script script/deploy/DeployWETH.s.sol --rpc-url "$RPC_URL" --broadcast --private-key "$DEPLOYER_KEY"

# HealthOracle - reads ORACLE_ADMIN/SCORER/GUARDIAN from .env.
forge script script/deploy/DeployHealthOracle.s.sol --rpc-url "$RPC_URL" --broadcast --private-key "$DEPLOYER_KEY"

# Register every protocol in apps/web/seed/protocols.json - required once
# before setScore()/scoreOf() work for any of them (NotRegistered otherwise).
# Must broadcast as the ORACLE_ADMIN key (.keys/ORACLE_ADMIN.txt) - registerProtocol() is admin-gated.
ORACLE_ADDRESS=<HealthOracle address from above> \
forge script script/admin/RegisterProtocolsFromSeed.s.sol --rpc-url "$RPC_URL" --broadcast --private-key <ORACLE_ADMIN private key>

# VaultFactory + VigilVault.
forge script script/deploy/DeployVault.s.sol --rpc-url "$RPC_URL" --broadcast --private-key "$DEPLOYER_KEY"

# 42 MockStrategyAdapters (one per apps/web/seed/strategies.json entry) -
# wires the first 8 unique protocolIds into the vault (VigilVault.MAX_ADAPTERS).
# Must also broadcast as the ORACLE_ADMIN key - addAdapter() is admin-gated.
# --slow avoids public-RPC "in-flight transaction limit" errors with this many txs.
forge script script/deploy/DeployMockStrategyAdapters.s.sol --rpc-url "$RPC_URL" --broadcast --slow --private-key <ORACLE_ADMIN private key>
```

`SeedTokens.s.sol` also no-ops on any non-local chain (real DeFi tokens
already exist on Base Sepolia's mainnet-adjacent contracts where they exist
at all) — skip it here.

`DeployVault.s.sol` and `DeployMockStrategyAdapters.s.sol` both work against
any vault, not just a WETH one — see their own doc comments for the
`VAULT_ADDRESS` / `WRAP_NATIVE` overrides if deploying a second vault on a
different underlying token.

After any manual (non-`deploy.sh`) run, sync the frontend yourself:

```
(cd ../web && npx tsx scripts/sync-contracts.ts)
```

## Base mainnet

Not done, and shouldn't be attempted casually — real funds, real
irreversibility. Same script set as Base Sepolia applies once you're
actually ready.

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
