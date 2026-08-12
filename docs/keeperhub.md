# KeeperHub — the on-chain automation layer

The piece that closes the loop from computed health scores to actual
on-chain action — `HealthOracle.setScore()` and `VigilVault.rebalance()` —
is **not code in this repo**. It's a workflow configured on the KeeperHub
platform (a visual automation/workflow builder, in the vein of n8n or
Zapier, with native web3 read/write actions). This repo only holds an
_export_ of that workflow for reference:
`vigil-work-flow.workflow.json` at the repo root.

**Don't look for this logic in `apps/api`** — a survey of that service
found no web3/wallet-signing code anywhere in it, which is correct: it was
never supposed to be there. `apps/api` computes scores and stores them;
KeeperHub is the thing that reads them back out and writes them on-chain.

## What the exported workflow actually does

Trigger: **schedule, `*/15 * * * *`** (every 15 minutes). Two independent
branches fan out from it:

### Branch 1 — refresh scores, then push them on-chain

```
schedule trigger
   │
   ├─▶ POST {API_URL}/webhook/ingest?secret=...   (kicks off apps/api's
   │                                                ingest+score sweep)
   │
   └─▶ Database Query:
       SELECT DISTINCT ON (protocol) protocol, score
       FROM health_scores ORDER BY protocol, timestamp DESC
          │
          ▼
       For Each row
          │
          ▼
       Run Code: {protocol, score} → {id: bytes32(protocol), value: uint16(score)}
          │
          ▼
       web3/write-contract: HealthOracle.setScore(id, value)
       on Base Sepolia (84532), contract 0x7319...485ba
```

The webhook call and the DB query fire in parallel off the same trigger —
KeeperHub has its own direct Postgres connection (the same database
`apps/api` writes to) rather than waiting on the webhook's response, so a
given run's on-chain writes reflect whatever `health_scores` rows existed
_at trigger time_, not necessarily the ones the webhook call just
produced. In practice, run-over-run this converges to current since it
runs every 15 minutes regardless.

### Branch 2 — rebalance every vault

```
schedule trigger
   │
   ▼
web3/read-contract: VaultFactory.vaultCount()
   │
   ▼
Run Code: count N → [0, 1, ..., N-1]
   │
   ▼
For Each index
   │
   ▼
web3/read-contract: VaultFactory.vaults(index)  →  vault address
   │
   ▼
Collect (gathers every vault address from the loop into one array)
   │
   ▼
For Each vault address
   │
   ▼
web3/write-contract: VigilVault.rebalance()
```

This is a brute-force "enumerate every vault the factory knows about, call
`rebalance()` on each" — not filtered by whether a vault actually needs
rebalancing (e.g. whether any adapter's target weight has drifted from its
current allocation). `rebalance()` is cheap to call on an already-balanced
vault (see
[`../apps/contracts/documentation/vaults.md`](../apps/contracts/documentation/vaults.md#weighting-and-rebalance)),
so this is a correct if unoptimized approach.

## What this means for `apps/api`'s docs

[`api.md`](./api.md) describes `apps/api` in isolation and is accurate for
what's _in that codebase_ — no scheduler, no web3 code, no `execution/`
package. That's by design, not a gap: the scheduling and on-chain execution
both live in KeeperHub instead. Read the two docs together: `api.md` for
"what computes a score," this file for "what happens to that score
afterward."

One thing `api.md` _did_ get right and still holds: `apps/api`'s own
`scoring/delta.py` (which imports a nonexistent `execution` package) is
genuinely dead code regardless — it's not what KeeperHub calls into.
KeeperHub reads `health_scores` directly via SQL, bypassing any Python code
path in `apps/api` entirely for the on-chain-write side.

## Contract addresses baked into the exported workflow

Both match this repo's current live Base Sepolia deployment:

- `HealthOracle`: `0x731963f3f23267481aa8ff78051902bccf3485ba`
- `VaultFactory`: `0x2c14b5d390e6b84d865759e261d746c30700c5ad`

If either gets redeployed, the KeeperHub workflow needs its `contractAddress`
fields updated to match — there's no dynamic lookup against
`deployedContracts.json` the way `ponder.config.ts` and `sync-contracts.ts`
do (see [`ponder.md`](./ponder.md)). This is a real coupling point to
remember on redeploy.

## Known issue in the exported workflow

Two nodes carry `"status": "error"` in the export: the scoring branch's
per-row `For Each` (`ttNW9STsjf895NpvPsQ-b`) and the rebalance branch's
`For Each` over collected vault addresses (`3ioqdxVSb59CxZiE60iEy`). The
export doesn't capture _why_ — it may be stale from before vaults/scores
existed to iterate over, or a real ongoing failure. Verify on the KeeperHub
dashboard directly rather than assuming either from this file alone.

## Security note

The exported JSON has the ingest webhook's full URL **including
`INGEST_WEBHOOK_SECRET` in cleartext** as a query parameter. Don't commit
this file to a public remote without stripping that value — see the repo's
top-level `.gitignore` (add an entry for `vigil-work-flow.workflow.json` if
you intend to keep exporting it here) or rotate the secret if it's already
been pushed.
