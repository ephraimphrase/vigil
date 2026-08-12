# HealthOracle (`src/oracle/HealthOracle.sol`)

A single 0–100 "health score" per protocol (`bytes32 protocolId`), written
by an offchain scorer. The contract's own header comment is worth quoting
directly, because it states the design goal precisely:

> This reports an OPINION an LLM formed, not a measurable fact. There is no
> ground truth to check it against, so the design goal is not accuracy — it
> is bounding what a compromised scorer key can do... A fully compromised
> scorer produces a bad allocation across whitelisted adapters. It can never
> move funds anywhere.

`HealthOracle` has **zero custody of funds**, ever. It is a pure read model
that `VigilVault.rebalance()` consumes; nothing forces anyone to act on a
score, and every path from a score change to an actual fund movement passes
through the vault's own access control.

## Roles

- **`DEFAULT_ADMIN_ROLE`** — registers new protocols (`registerProtocol`).
  Cannot write scores.
- **`SCORER_ROLE`** — writes scores (`setScore`/`setScores`). Explicitly
  documented as "the least-protected key in the system" — the bounds below
  exist specifically because this key is expected to eventually leak or be
  automated by something less trustworthy than a human.
- **`GUARDIAN_ROLE`** — can only force a score to zero (`emergencyZero`).
  One-directional by design: a guardian who could _raise_ a score could
  steer funds into a failing protocol, which defeats the point of having a
  guardian at all.

## What bounds a compromised scorer key

| Bound          | Value                                                | Effect                                                                                   |
| -------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `MAX_SCORE`    | 100                                                  | scores are always in [0, 100]                                                            |
| `MAX_DELTA`    | 30                                                   | one `setScore` call can move a score at most ±30                                         |
| `MIN_INTERVAL` | 5 minutes                                            | one write per protocol per interval                                                      |
| staleness      | `stalenessWindow` (constructor arg, default 6h if 0) | consumers (i.e. `VigilVault`) must treat a score older than this as **0**, not "unknown" |

A leaked scorer key needs several spaced writes to move a score from the
middle of the range to an extreme — enough real time for a human to notice
unusual activity and revoke the role before serious damage compounds. The
delta clamp has one sharp edge worth knowing: near the bottom of the range
(`old <= MAX_DELTA`), the floor of the clamp collapses to 0, so a single
write _can_ zero a score outright — same practical effect as
`emergencyZero`, just scorer-gated instead of guardian-gated. This is called
out explicitly in the contract's own comments, not an accidental edge case.

## Registering a protocol

```solidity
function registerProtocol(bytes32 protocolId, uint16 initialScore) external onlyRole(DEFAULT_ADMIN_ROLE)
```

Admin-gated, not scorer-gated — deliberately: "the scorer opines on
protocols a human already approved — it cannot introduce new ones." Reverts
`AlreadyRegistered` on a repeat call for the same id, so re-running
`RegisterProtocolsFromSeed.s.sol` against an oracle that already has some
protocols registered is safe (it try/catches per-protocol and logs a skip,
rather than reverting the whole batch).

`protocolId` is `bytes32(bytes(id))` — left-aligned ASCII, the same
encoding `cast format-bytes32-string <id>` produces. A later `setScore` for,
say, `"aave"` needs that exact same encoding to hit the right slot.

## Reading a score

```solidity
function scoreOf(bytes32 protocolId) external view returns (uint16 score, uint40 updatedAt)
```

An **unregistered** protocol returns `(0, 0)` rather than reverting — by
design, so a consumer's "silence reads as exit" logic (see
[`vaults.md`](./vaults.md)'s weighting section) works uniformly whether a
protocol was never registered or its score has simply gone stale.

## Where the actual protocol list comes from

`RegisterProtocolsFromSeed.s.sol` reads `apps/web/seed/protocols.json` — the
same canonical list `apps/web`'s own DB seeding uses — as the single source
of truth for "which protocols exist," rather than maintaining a second,
separately-curated list that could drift. Each protocol's seeded `score`
field becomes its `initialScore`.
