// ─────────────────────────────────────────────────────────────
// Activity mock — the audit trail. One of every EventKind, plus the three
// scenarios the staged-timeline UI exists to prove: a partial exit (3 of 5
// strategies, 2 reverted), a reverted-then-retried execution (gas
// backoff), and a circuit-breaker trip. Also covers: a trigger that leads
// to an alert instead of an execution (trigger ≠ execution), and an
// aborted simulation that caught a bad trade before it happened.
// No DB table for this yet - lives here like vault originally did, served
// by app/api/activity/route.ts.
// ─────────────────────────────────────────────────────────────

import moment from "moment";
import type { ActivityEntry } from "../types";

const iso = (minsAgo: number) => moment().subtract(minsAgo, "minutes").toISOString();
const etherscan = (tx: string) => `https://etherscan.io/tx/${tx}`;
const x402scan = (tx: string) => `https://x402scan.com/tx/${tx}`;

export const ACTIVITY_ENTRIES: ActivityEntry[] = [
  // ─── housekeeping ───
  {
    id: "a1",
    ts: iso(2),
    kind: "cycle",
    message: "Polling cycle complete — 22 protocols scored",
  },
  {
    id: "a2",
    ts: iso(9),
    kind: "score",
    protocolId: "aave",
    message: "Aave health updated",
    score: 79,
  },

  // ─── clean execution: trigger → simulation → execution ───
  {
    id: "a3",
    ts: iso(60 * 8),
    kind: "trigger",
    protocolId: "aave",
    message: "Trigger fired: 7d score decline",
    score: 79,
    delta: -9,
    action: "reduce_25",
    reasoning: "Aave's 7-day rolling average dropped from 88 to 79, a 9-point decline exceeding the 5-point drift threshold. Policy calls for a 25% reduction at this band.",
  },
  {
    id: "a4",
    ts: iso(60 * 8 - 1),
    kind: "simulation",
    protocolId: "aave",
    triggerId: "a3",
    message: "Simulated reduce_25 on Aave",
    stages: [
      { label: "Trigger", status: "ok", detail: "7d score decline confirmed: 88 → 79", ts: iso(60 * 8) },
      { label: "Simulation", status: "ok", detail: "Dry-run reduce_25 on Aave: withdraw 4,200 aUSDC, projected slippage 0.08%, gas ≈ $4.20", ts: iso(60 * 8 - 1) },
    ],
  },
  {
    id: "a5",
    ts: iso(60 * 8 - 2),
    kind: "execution",
    protocolId: "aave",
    triggerId: "a3",
    message: "Reduced Aave position 25%",
    score: 79,
    delta: -9,
    action: "reduce_25",
    txHash: "0x8f3a1c9edb2f4a6e7c05a1b9d3e8f2c4a6b8d0e2f4a6c8e0b2d4f6a8c0e2b4d6",
    reasoning: "Aave's 7-day rolling average dropped from 88 to 79, a 9-point decline exceeding the 5-point drift threshold.",
    stages: [
      { label: "Trigger", status: "ok", detail: "7d score decline confirmed: 88 → 79", ts: iso(60 * 8) },
      { label: "Simulation", status: "ok", detail: "Dry-run OK, projected slippage 0.08%", ts: iso(60 * 8 - 1) },
      { label: "Submission", status: "ok", detail: "Withdraw tx submitted for 4,200 aUSDC", ts: iso(60 * 8 - 2) },
      { label: "Gas", status: "ok", detail: "Confirmed at 31 gwei, first attempt", ts: iso(60 * 8 - 2) },
      { label: "Outcome", status: "ok", detail: "Position reduced 25%, confirmed block 21,880,112", ts: iso(60 * 8 - 2) },
    ],
    gasCostUsd: 4.35,
    mevProtected: true,
    keeperHubRef: "kh-7734",
    etherscanUrl: etherscan("0x8f3a1c9edb2f4a6e7c05a1b9d3e8f2c4a6b8d0e2f4a6c8e0b2d4f6a8c0e2b4d6"),
    x402ScanUrl: x402scan("0x8f3a1c9edb2f4a6e7c05a1b9d3e8f2c4a6b8d0e2f4a6c8e0b2d4f6a8c0e2b4d6"),
  },

  // ─── trigger ≠ execution: notify-only, autonomy = alert ───
  {
    id: "a6",
    ts: iso(60 * 12),
    kind: "trigger",
    protocolId: "curve",
    message: "Trigger fired: dropped below watch threshold",
    score: 71,
    delta: -6,
    action: "alert",
    reasoning: "Curve's score crossed below the 75 watch threshold set by policy. Autonomy for Curve strategies is 'alert' — the engine notifies rather than acting.",
  },
  {
    id: "a7",
    ts: iso(60 * 12 - 1),
    kind: "alert",
    protocolId: "curve",
    triggerId: "a6",
    message: "Curve dropped below watch threshold — notify only, no action taken",
    score: 71,
  },

  // ─── aborted simulation: caught before it became a bad execution ───
  {
    id: "a8",
    ts: iso(60 * 20),
    kind: "trigger",
    protocolId: "venus",
    message: "Trigger fired: 24h score decline",
    score: 74,
    delta: -7,
    action: "reduce_25",
    reasoning: "Venus's 24h score dropped 7 points, crossing into reduce_25 territory.",
  },
  {
    id: "a9",
    ts: iso(60 * 20 - 1),
    kind: "simulation",
    protocolId: "venus",
    triggerId: "a8",
    message: "Simulated reduce_25 on Venus — aborted, slippage exceeded policy cap",
    stages: [
      { label: "Trigger", status: "ok", detail: "24h score decline confirmed: 81 → 74", ts: iso(60 * 20) },
      { label: "Simulation", status: "aborted", detail: "Dry-run reduce_25 on Venus: thin liquidity would realize 4.1% slippage against a 1% policy cap. Execution withheld, escalated for manual review.", ts: iso(60 * 20 - 1) },
    ],
  },

  // ─── partial exit: 3 of 5 strategies exited, 2 reverted ───
  {
    id: "a10",
    ts: iso(60 * 30),
    kind: "trigger",
    protocolId: "curve",
    message: "Trigger fired: full exit — score fell to 38 across all Curve strategies",
    score: 38,
    delta: -33,
    action: "exit",
    reasoning: "Curve's score fell to 38 (below the 40 exit floor) across all 5 wrapped Convex/StakeDAO strategy contracts.",
  },
  {
    id: "a11",
    ts: iso(60 * 30 - 2),
    kind: "execution",
    protocolId: "curve",
    triggerId: "a10",
    message: "Exited 3 of 5 Curve strategies — 2 reverted",
    score: 38,
    action: "exit",
    txHash: "0x71ab4d8c2e6f0a3b5d7e9c1f3a5b7d9e1c3a5f7b9d1e3c5a7f9b1d3e5c7a9f1b",
    reasoning: "Full exit ordered across all 5 Curve strategy contracts after score fell to 38.",
    stages: [
      { label: "Trigger", status: "ok", detail: "Score 38, below the 40 exit floor across all Curve strategies", ts: iso(60 * 30) },
      { label: "Simulation", status: "ok", detail: "Dry-run full exit across 5 contracts: projected total slippage 0.6%", ts: iso(60 * 30 - 1) },
      { label: "Submission", status: "ok", detail: "5 exit transactions submitted", ts: iso(60 * 30 - 2) },
      { label: "Outcome", status: "failed", detail: "3 of 5 exits confirmed; 2 reverted on gas-limit underestimate — see per-strategy detail", ts: iso(60 * 30 - 2) },
    ],
    strategyResults: [
      { protocolId: "curve", name: "Curve Convex Vault", status: "ok", txHash: "0x71ab...9f01" },
      { protocolId: "curve", name: "Curve Convex CRV Stake", status: "ok", txHash: "0x71ab...9f02" },
      { protocolId: "curve", name: "Curve StakeDAO Vault", status: "ok", txHash: "0x71ab...9f03" },
      { protocolId: "curve", name: "Curve Convex CVX Stake", status: "reverted", note: "Reverted: out of gas — retry queued for next cycle" },
      { protocolId: "curve", name: "Curve Convex Staking", status: "reverted", note: "Reverted: out of gas — retry queued for next cycle" },
    ],
    gasCostUsd: 18.4,
    mevProtected: true,
    keeperHubRef: "kh-7801",
    etherscanUrl: etherscan("0x71ab4d8c2e6f0a3b5d7e9c1f3a5b7d9e1c3a5f7b9d1e3c5a7f9b1d3e5c7a9f1b"),
    x402ScanUrl: x402scan("0x71ab4d8c2e6f0a3b5d7e9c1f3a5b7d9e1c3a5f7b9d1e3c5a7f9b1d3e5c7a9f1b"),
  },

  // ─── reverted then retried: gas backoff ───
  {
    id: "a12",
    ts: iso(60 * 45),
    kind: "execution",
    protocolId: "sky",
    message: "Reduced Sky position 25% — succeeded on retry 2",
    score: 60,
    action: "reduce_25",
    txHash: "0x4c9e6a2b8d0f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2a4c",
    reasoning: "Sky's score dropped to 60, crossing into reduce_25 band.",
    stages: [
      { label: "Trigger", status: "ok", detail: "Score crossed to 60", ts: iso(60 * 45) },
      { label: "Simulation", status: "ok", detail: "Dry-run OK, gas estimate 32 gwei", ts: iso(60 * 45 - 1) },
      { label: "Submission", status: "failed", detail: "Attempt 1 reverted — underpriced during a base-fee spike", ts: iso(60 * 45 - 2) },
      { label: "Gas retry", status: "ok", detail: "Resubmitted at 48 gwei, confirmed on attempt 2", ts: iso(60 * 45 - 3) },
      { label: "Outcome", status: "ok", detail: "Position reduced 25%, confirmed block 21,882,410", ts: iso(60 * 45 - 3) },
    ],
    retries: [
      { attempt: 1, ts: iso(60 * 45 - 2), gasPriceGwei: 32, status: "underpriced", note: "Base fee spiked mid-block; transaction stuck" },
      { attempt: 2, ts: iso(60 * 45 - 3), gasPriceGwei: 48, status: "ok" },
    ],
    gasCostUsd: 11.2,
    mevProtected: false,
    keeperHubRef: "kh-7790",
    etherscanUrl: etherscan("0x4c9e6a2b8d0f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2a4c"),
    x402ScanUrl: x402scan("0x4c9e6a2b8d0f4a6c8e0b2d4f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2a4c"),
  },

  // ─── circuit breaker: always-on floor, independent of autonomy ───
  {
    id: "a13",
    ts: iso(60 * 60),
    kind: "circuit_breaker",
    protocolId: "morpho",
    message: "Circuit breaker tripped — Morpho executions frozen after 3 consecutive reverts",
    circuitBreakerReason: "3 consecutive execution reverts on Morpho within 15 minutes (gas underpriced ×2, slippage cap exceeded ×1). Autonomy for Morpho suspended and escalated for manual review — this floor is independent of autonomy level and can fire even in full Auto.",
    stages: [
      { label: "Trigger", status: "ok", detail: "Score-driven reduce_25 re-attempted after 2 prior reverts", ts: iso(60 * 60 + 5) },
      { label: "Circuit breaker", status: "failed", detail: "3rd consecutive revert within the 15-minute window — safety floor tripped", ts: iso(60 * 60) },
      { label: "Outcome", status: "skipped", detail: "Morpho executions frozen; escalated to manual review queue", ts: iso(60 * 60) },
    ],
  },

  // ─── approval flow: requested → granted → executed ───
  {
    id: "a14",
    ts: iso(60 * 70),
    kind: "approval",
    protocolId: "stargate",
    message: "Approval requested: reduce_25 on Stargate",
    approvalStatus: "requested",
    reasoning: "Stargate's score dropped to 71. Autonomy for Stargate is 'approve' — awaiting operator sign-off before execution.",
  },
  {
    id: "a15",
    ts: iso(60 * 70 - 1),
    kind: "approval",
    protocolId: "stargate",
    triggerId: "a14",
    message: "Approval granted: reduce_25 on Stargate",
    approvalStatus: "granted",
  },
  {
    id: "a16",
    ts: iso(60 * 70 - 2),
    kind: "execution",
    protocolId: "stargate",
    triggerId: "a14",
    message: "Reduced Stargate position 25%",
    action: "reduce_25",
    txHash: "0x2b71c9e3a5d7f9b1c3e5a7d9f1b3c5e7a9d1f3b5c7e9a1d3f5b7c9e1a3d5f7b9",
    stages: [
      { label: "Trigger", status: "ok", detail: "Score 71, reduce_25 band", ts: iso(60 * 70) },
      { label: "Approval", status: "ok", detail: "Operator approved via dashboard", ts: iso(60 * 70 - 1) },
      { label: "Simulation", status: "ok", detail: "Dry-run OK", ts: iso(60 * 70 - 1) },
      { label: "Submission", status: "ok", detail: "Confirmed block 21,881,900", ts: iso(60 * 70 - 2) },
      { label: "Outcome", status: "ok", detail: "Position reduced 25%", ts: iso(60 * 70 - 2) },
    ],
    gasCostUsd: 3.9,
    mevProtected: true,
    keeperHubRef: "kh-7650",
    etherscanUrl: etherscan("0x2b71c9e3a5d7f9b1c3e5a7d9f1b3c5e7a9d1f3b5c7e9a1d3f5b7c9e1a3d5f7b9"),
    x402ScanUrl: x402scan("0x2b71c9e3a5d7f9b1c3e5a7d9f1b3c5e7a9d1f3b5c7e9a1d3f5b7c9e1a3d5f7b9"),
  },
];
