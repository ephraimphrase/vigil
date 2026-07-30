// ─────────────────────────────────────────────────────────────
// Seed data — the single entry point every API route imports from, and
// what scripts/seed-db.ts loads into the shared Postgres DB. Not "mock"
// data sitting alongside real data - this IS the source of truth for
// anything not yet read live from Postgres (see app/api/protocols/route.ts
// and app/api/protocols/[id]/route.ts, which query the DB directly).
// Small/computed data (overview, vault) lives here directly; strategies
// and the protocol list stay as their own JSON files and get assembled
// below rather than inlined.
// Vault is keyed by slug (VAULT_MOCKS) rather than a single object - one
// entry today (see DEFAULT_VAULT_SLUG), ready for more without a shape
// change. app/api/vault/[slug]/route.ts serves one entry via getVault();
// app/api/vaults serves SEED.vaultList for the /dashboard/vault picker.
// ─────────────────────────────────────────────────────────────

import moment from "moment";
import type { OverviewData, StrategiesData, ProtocolRow, VaultData, VaultInfo } from "../types";

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

export const DEFAULT_VAULT_SLUG = "balanced";

const VAULT_MOCKS: Record<string, VaultData> = {
  balanced: {
    info: {
      slug: "balanced",
      name: "Balanced Vault",
      asset: "USDC",
      totalAssets: 74500,
      totalShares: 72753.91,
      sharePrice: 1.024,
      idle: 3350,
      tvl: 1_240_000,
      benchmarkDeltaPct: 2.1,
    },
    policy: {
      name: "Balanced",
      maxWeightPerProtocol: 0.35,
      exitFloorScore: 60,
      cooldownHours: 6,
      autonomyDefault: "auto",
      excludedProtocols: ["radiant", "hundred"],
    },
    position: {
      shares: 47120.11,
      valueUsd: 48250,
      costBasisUsd: 47000,
      pnlUsd: 1250,
      walletUsdc: 5200,
    },
    allocation: [
      { protocolId: "aave",     name: "Aave",     category: "lending", targetWeight: 0.30, actualWeight: 0.348, valueUsd: 16800, score: 79 },
      { protocolId: "lido",     name: "Lido",     category: "lsd",     targetWeight: 0.30, actualWeight: 0.294, valueUsd: 14200, score: 83 },
      { protocolId: "sky",      name: "Sky",      category: "cdp",     targetWeight: 0.25, actualWeight: 0.251, valueUsd: 12100, score: 81 },
      { protocolId: "uniswap",  name: "Uniswap",  category: "dex",     targetWeight: 0.15, actualWeight: 0.107, valueUsd: 5150,  score: 88 },
      { protocolId: "morpho",   name: "Morpho",   category: "lending", targetWeight: 0.09, actualWeight: 0.085, valueUsd: 6000,  score: 85 },
      { protocolId: "venus",    name: "Venus",    category: "lending", targetWeight: 0.07, actualWeight: 0.065, valueUsd: 4500,  score: 74 },
      { protocolId: "stargate", name: "Stargate", category: "dex",     targetWeight: 0.05, actualWeight: 0.045, valueUsd: 3200,  score: 86 },
      { protocolId: "compound", name: "Compound", category: "lending", targetWeight: 0.06, actualWeight: 0.056, valueUsd: 5000,  score: 87 },
      { protocolId: "curve",    name: "Curve",    category: "dex",     targetWeight: 0.05, actualWeight: 0.048, valueUsd: 4200,  score: 82 },
    ],
    riskChecks: [
      { id: "audited", label: "Underlying strategies audited", passed: true },
      { id: "timelock", label: "Vault upgrades behind timelock", passed: true },
      { id: "oracle", label: "No single-oracle dependency", passed: true, note: "Aave and Sky both price off Chainlink; the Uniswap leg uses a TWAP, not a single spot feed." },
      { id: "concentration", label: "No protocol above the policy cap", passed: true },
      { id: "admin-keys", label: "Admin keys held by a multisig, not an EOA", passed: false, note: "Vault owner is currently a 2-of-3 multisig pending migration to a Gnosis Safe." },
    ],
  },
};

export function getVault(slug: string): VaultData | undefined {
  return VAULT_MOCKS[slug];
}

const vaultList: VaultInfo[] = Object.values(VAULT_MOCKS).map((v) => v.info);

const strategies = strategiesData as StrategiesData;
const protocols = protocolsData as ProtocolRow[];

// No protocolDetail here - app/api/protocols/[id]/route.ts queries the
// `protocols` table in Postgres directly. protocol-detail/*.json still
// exists as seed input for scripts/seed-db.ts, not served from here.
export const SEED = { overview, vaultList, strategies, protocols };
