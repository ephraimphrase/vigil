// ─────────────────────────────────────────────────────────────
// Overview mock. Positions reference the same protocol ids as the detail
// mock so cards can deep-link to /protocol/:id. Swap for live vault +
// strategy reads; the event list is replaced by the WebSocket stream.
// ─────────────────────────────────────────────────────────────

import moment from "moment";
import type { OverviewData } from "../types";

const iso = (minsAgo: number) => moment().subtract(minsAgo, "minutes").toISOString();

export const MOCK_OVERVIEW: OverviewData = {
  status: { state: "running", watchedCount: 5, lastCycle: iso(3) },
  portfolio: {
    totalValue: 48250.42,
    shares: 47120.11,
    sharePrice: 1.0240,
    pnl24h: 182.3,
    pnlPct24h: 0.38,
    benchmarkDeltaPct: 2.1,
  },
  positions: [
    { protocolId: "aave",    name: "Aave",   category: "lending", allocated: 16800, targetWeight: 0.30, actualWeight: 0.348, score: 79, apy: 4.8, lastRebalance: iso(60 * 8) },
    { protocolId: "lido",    name: "Lido",   category: "lsd",     allocated: 14200, targetWeight: 0.30, actualWeight: 0.294, score: 83, apy: 3.1, lastRebalance: iso(60 * 26) },
    { protocolId: "sky",     name: "Sky",    category: "cdp",     allocated: 12100, targetWeight: 0.25, actualWeight: 0.251, score: 81, apy: 3.75, lastRebalance: iso(60 * 26) },
    { protocolId: "uniswap", name: "Uniswap",category: "dex",     allocated: 5150,  targetWeight: 0.15, actualWeight: 0.107, score: 88, apy: 9.2, lastRebalance: iso(60 * 50) },
  ],
  events: [
    { id: "e1", ts: iso(3),   kind: "cycle",     message: "Polling cycle complete — 5 protocols scored" },
    { id: "e2", ts: iso(9),   kind: "score",     protocolId: "aave", message: "Aave health updated", score: 79 },
    { id: "e3", ts: iso(60 * 8), kind: "execution", protocolId: "aave", message: "Reduced Aave position 25%", action: "reduce_25", txHash: "0x8f3a...c21b" },
    { id: "e4", ts: iso(60 * 8), kind: "trigger",   protocolId: "aave", message: "Trigger fired: 7d score decline", score: 79, action: "reduce_25" },
    { id: "e5", ts: iso(60 * 12), kind: "alert",    protocolId: "curve", message: "Curve dropped below watch threshold", score: 71 },
  ],
  pendingApprovals: 2,
};
