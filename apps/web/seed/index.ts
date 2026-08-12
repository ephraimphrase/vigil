// ─────────────────────────────────────────────────────────────
// Seed data — the single entry point every API route imports from, and
// what scripts/seed-db.ts loads into the shared Postgres DB. Not "mock"
// data sitting alongside real data - this IS the source of truth for
// anything not yet read live from Postgres (see app/api/protocols/route.ts
// and app/api/protocols/[id]/route.ts, which query the DB directly).
// Small/computed data (overview) lives here directly; strategies and the
// protocol list stay as their own JSON files and get assembled below
// rather than inlined. Vault has no seed of its own anymore - both
// app/api/vaults/route.ts and app/api/vault/[slug]/route.ts read live from
// Ponder (lib/ponder/mappers/vaultSummary.ts, vaultData.ts).
// ─────────────────────────────────────────────────────────────

import moment from "moment";
import type { OverviewData, StrategiesData, ProtocolRow, ActivityData, TransactionsData } from "../types";
import { ACTIVITY_ENTRIES } from "./activity";
import { TRANSACTION_ENTRIES } from "./transactions";

import strategiesData from "./strategies.json";
import protocolsData from "./protocols.json";

const iso = (minsAgo: number) => moment().subtract(minsAgo, "minutes").toISOString();

const overview: OverviewData = {
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

const strategies = strategiesData as StrategiesData;
const protocols = protocolsData as ProtocolRow[];
const activity: ActivityData = { entries: ACTIVITY_ENTRIES };
const transactions: TransactionsData = { entries: TRANSACTION_ENTRIES };

// No protocolDetail here - app/api/protocols/[id]/route.ts queries the
// `protocols` table in Postgres directly. protocol-detail/*.json still
// exists as seed input for scripts/seed-db.ts, not served from here.
export const SEED = { overview, strategies, protocols, activity, transactions };
