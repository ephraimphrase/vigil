# Vigil contracts — documentation

How the system actually works, contract by contract. For "how do I run the
deploy scripts," see [`../DEPLOYMENT.md`](../DEPLOYMENT.md) instead — this
folder explains the mechanics; that file explains the commands.

## The pieces, in one paragraph each

- **[Tokens](./tokens.md)** — `WETH9` (Base's real predeploy is used instead
  on Base Sepolia/mainnet), and `SeedTokenFactory` + `SeedToken`, a
  minimal-proxy factory that stamps out ERC20 clones for testnet DeFi tokens
  (steth, aave, uni, ...), each mintable by anyone via a testnet-only
  `mint()`.
- **[HealthOracle](./oracle.md)** — a single 0–100 "health score" per
  protocol, written by an offchain scorer key whose blast radius is bounded
  on-chain (max delta per write, rate limit, one-way emergency zero). This is
  the only signal vaults act on; it has no way to move funds itself.
- **[Vaults](./vaults.md)** — `VaultFactory` (one `VigilVault` per
  underlying asset) and `VigilVault` itself (an ERC-4626 vault that splits
  deposits across a whitelisted set of adapters, weighted by each adapter's
  live `HealthOracle` score).
- **[Adapters](./adapters.md)** — `IVigilProtocolAdapter`, the uniform
  interface every yield venue integration implements, and
  `MockStrategyAdapter`, the only implementation actually deployable today
  (real protocol adapters under `src/beefy_strategies/` need
  infrastructure that doesn't exist in this repo yet).
- **[Faucet](./faucet.md)** — mints `SeedToken` supply on demand for testnet
  users, rate-limited per token per address. Holds no balance between calls.

## How they fit together

```
                    ┌─────────────────┐
   offchain scorer  │   HealthOracle   │  scores 0-100 per protocolId,
   (SCORER_ROLE) ──▶│                  │  rate-limited, no fund custody
                    └────────┬─────────┘
                             │ scoreOf(protocolId)
                             ▼
┌──────────────┐    ┌──────────────────┐        ┌─────────────────────┐
│ VaultFactory │───▶│    VigilVault    │───────▶│  IVigilProtocolAdapter │
│ one per asset│    │ (ERC-4626 shares) │  N of   │  (MockStrategyAdapter │
└──────────────┘    │  rebalance() moves│  these  │   today; a real venue │
                     │  funds by weight  │◀───────│   integration later)  │
                     └────────┬──────────┘        └───────────┬──────────┘
                              │ asset()                        │ underlying
                              ▼                                ▼
                     ┌──────────────────────────────────────────────┐
                     │        SeedToken (or WETH9, or a real ERC20)   │
                     └──────────────────────────────────────────────┘
                              ▲
                              │ mint() / claim()
                     ┌──────────────────┐
                     │      Faucet       │
                     └──────────────────┘
```

Nothing here custodies user funds except `VigilVault` itself and whatever
adapters it's whitelisted — `HealthOracle` only ever _opines_; every write
that actually moves money requires a role grant on the vault or an adapter,
never the oracle.

## Roles at a glance

| Role                 | Lives on                     | Can do                                                   | Cannot do                               |
| -------------------- | ---------------------------- | -------------------------------------------------------- | --------------------------------------- |
| `DEFAULT_ADMIN_ROLE` | `HealthOracle`, `VigilVault` | register protocols; add/remove adapters                  | write scores; call `rebalance()`        |
| `SCORER_ROLE`        | `HealthOracle`               | write scores, bounded ±30/write, 1 per 5 min             | register new protocols; move any funds  |
| `GUARDIAN_ROLE`      | `HealthOracle`, `VigilVault` | force a score to 0; evacuate one adapter's funds to idle | raise a score; add adapters             |
| `KEEPER_ROLE`        | `VigilVault`                 | call `rebalance()`                                       | add/remove adapters; withdraw to itself |

The Base Sepolia deployment in this repo currently collapses admin/scorer/
guardian/keeper to one address for convenience (see `.env`'s
`ORACLE_ADMIN`/`ORACLE_SCORER`/`ORACLE_GUARDIAN`/`VAULT_KEEPER`, all the same
value). That's fine for a testnet demo; production must use distinct keys —
see [`../DEPLOYMENT.md`](../DEPLOYMENT.md#role-keys).
