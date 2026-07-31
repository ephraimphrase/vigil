// ─────────────────────────────────────────────────────────────
// Seed data — the single entry point every API route imports from, and
// what scripts/seed-db.ts loads into the shared Postgres DB. Not "mock"
// data sitting alongside real data - this IS the source of truth for
// anything not yet read live from Postgres (see app/api/protocols/route.ts
// and app/api/protocols/[id]/route.ts, which query the DB directly).
// Small/computed data (overview, vault) lives here directly; strategies
// and the protocol list stay as their own JSON files and get assembled
// below rather than inlined.
// Vault is keyed by slug (VAULT_MOCKS): three policy tiers today
// (conservative/balanced/degen), DEFAULT_VAULT_SLUG picks which one a bare
// "the vault" reference means. app/api/vault/[slug]/route.ts serves one
// entry via getVault(); app/api/vaults serves SEED.vaultList for the
// /dashboard/vault picker.
// ─────────────────────────────────────────────────────────────

import moment from "moment";
import type { OverviewData, StrategiesData, ProtocolRow, VaultData, VaultSummary, ActivityData } from "../types";
import { vaultAggregate } from "../shared/vault";
import { ACTIVITY_ENTRIES } from "./activity";

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

// Three policy tiers, same protocol universe (the 9 scored protocols in
// strategies.json - the rest of that file has no health score yet, so
// nothing allocates capital there regardless of tier). Each tier reweights
// that universe toward its own risk appetite rather than picking different
// protocols out of thin air. `tvl` intentionally equals `totalAssets` - a
// vault's TVL *is* its assets under management, there's no second number.
const VAULT_MOCKS: Record<string, VaultData> = {
  conservative: {
    info: {
      slug: "conservative",
      name: "Conservative Vault",
      asset: "USDC",
      totalAssets: 512_000,
      totalShares: 496_606.21,
      sharePrice: 1.031,
      idle: 18_000,
      tvl: 512_000,
      benchmarkDeltaPct: 1.4,
    },
    policy: {
      name: "Conservative",
      maxWeightPerProtocol: 0.45,
      exitFloorScore: 70,
      cooldownHours: 3,
      autonomyDefault: "auto",
      excludedProtocols: ["radiant", "hundred"],
    },
    position: null,
    allocation: [
      { protocolId: "aave", name: "Aave", category: "lending", targetWeight: 0.40, actualWeight: 0.40, valueUsd: 197_600, score: 79, apy: 4.8 },
      { protocolId: "lido", name: "Lido", category: "lsd", targetWeight: 0.35, actualWeight: 0.35, valueUsd: 172_900, score: 83, apy: 3.1 },
      { protocolId: "sky", name: "Sky", category: "cdp", targetWeight: 0.25, actualWeight: 0.25, valueUsd: 123_500, score: 81, apy: 3.75 },
    ],
    riskChecks: [
      { id: "audited", label: "Underlying strategies audited", passed: true },
      { id: "timelock", label: "Vault upgrades behind timelock", passed: true },
      { id: "oracle", label: "No single-oracle dependency", passed: true, note: "Aave and Sky both price off Chainlink; Lido's wstETH rate is read directly from the token contract, not a feed." },
      { id: "concentration", label: "No protocol above the policy cap", passed: true },
      { id: "admin-keys", label: "Admin keys held by a multisig, not an EOA", passed: true, note: "Vault owner is a 3-of-5 Gnosis Safe." },
    ],
  },
  balanced: {
    info: {
      slug: "balanced",
      name: "Balanced Vault",
      asset: "USDC",
      totalAssets: 74_500,
      totalShares: 72_753.91,
      sharePrice: 1.024,
      idle: 3_350,
      tvl: 74_500,
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
      shares: 47_120.11,
      valueUsd: 48_250,
      costBasisUsd: 47_000,
      pnlUsd: 1_250,
      walletUsdc: 5_200,
    },
    allocation: [
      { protocolId: "aave", name: "Aave", category: "lending", targetWeight: 0.30, actualWeight: 0.348, valueUsd: 16_800, score: 79, apy: 4.8 },
      { protocolId: "lido", name: "Lido", category: "lsd", targetWeight: 0.30, actualWeight: 0.294, valueUsd: 14_200, score: 83, apy: 3.1 },
      { protocolId: "sky", name: "Sky", category: "cdp", targetWeight: 0.25, actualWeight: 0.251, valueUsd: 12_100, score: 81, apy: 3.75 },
      { protocolId: "uniswap", name: "Uniswap", category: "dex", targetWeight: 0.15, actualWeight: 0.107, valueUsd: 5_150, score: 88, apy: 9.2 },
      { protocolId: "morpho", name: "Morpho", category: "lending", targetWeight: 0.09, actualWeight: 0.085, valueUsd: 6_000, score: 85, apy: 5.5 },
      { protocolId: "venus", name: "Venus", category: "lending", targetWeight: 0.07, actualWeight: 0.065, valueUsd: 4_500, score: 74, apy: 6.1 },
      { protocolId: "stargate", name: "Stargate", category: "dex", targetWeight: 0.05, actualWeight: 0.045, valueUsd: 3_200, score: 86, apy: 4.2 },
      { protocolId: "compound", name: "Compound", category: "lending", targetWeight: 0.06, actualWeight: 0.056, valueUsd: 5_000, score: 87, apy: 4.3 },
      { protocolId: "curve", name: "Curve", category: "dex", targetWeight: 0.05, actualWeight: 0.048, valueUsd: 4_200, score: 82, apy: 5.8 },
    ],
    riskChecks: [
      { id: "audited", label: "Underlying strategies audited", passed: true },
      { id: "timelock", label: "Vault upgrades behind timelock", passed: true },
      { id: "oracle", label: "No single-oracle dependency", passed: true, note: "Aave and Sky both price off Chainlink; the Uniswap leg uses a TWAP, not a single spot feed." },
      { id: "concentration", label: "No protocol above the policy cap", passed: true },
      { id: "admin-keys", label: "Admin keys held by a multisig, not an EOA", passed: false, note: "Vault owner is currently a 2-of-3 multisig pending migration to a Gnosis Safe." },
    ],
  },
  degen: {
    info: {
      slug: "degen",
      name: "Degen Vault",
      asset: "USDC",
      totalAssets: 286_000,
      totalShares: 280_943.03,
      sharePrice: 1.018,
      idle: 9_000,
      tvl: 286_000,
      benchmarkDeltaPct: -1.8,
    },
    policy: {
      name: "Degen",
      maxWeightPerProtocol: 0.50,
      exitFloorScore: 45,
      cooldownHours: 2,
      autonomyDefault: "auto",
      excludedProtocols: ["radiant", "hundred"],
    },
    position: null,
    allocation: [
      { protocolId: "uniswap", name: "Uniswap", category: "dex", targetWeight: 0.40, actualWeight: 0.40, valueUsd: 110_800, score: 88, apy: 9.2 },
      { protocolId: "venus", name: "Venus", category: "lending", targetWeight: 0.30, actualWeight: 0.30, valueUsd: 83_100, score: 74, apy: 6.1 },
      { protocolId: "curve", name: "Curve", category: "dex", targetWeight: 0.20, actualWeight: 0.20, valueUsd: 55_400, score: 82, apy: 5.8 },
      { protocolId: "morpho", name: "Morpho", category: "lending", targetWeight: 0.10, actualWeight: 0.10, valueUsd: 27_700, score: 85, apy: 5.5 },
    ],
    riskChecks: [
      { id: "audited", label: "Underlying strategies audited", passed: true },
      { id: "timelock", label: "Vault upgrades behind timelock", passed: true },
      { id: "oracle", label: "No single-oracle dependency", passed: false, note: "The Uniswap leg prices off the pool's own spot ratio, not an external oracle - exposed to intra-block manipulation during thin liquidity." },
      { id: "concentration", label: "No protocol above the policy cap", passed: true },
      { id: "admin-keys", label: "Admin keys held by a multisig, not an EOA", passed: false, note: "Vault owner is currently a 2-of-3 multisig pending migration to a Gnosis Safe." },
    ],
  },
};

export function getVault(slug: string): VaultData | undefined {
  return VAULT_MOCKS[slug];
}

const vaultList: VaultSummary[] = Object.values(VAULT_MOCKS).map((v) => ({
  ...v.info,
  apy: vaultAggregate(v.allocation).weightedApy,
  riskFlagged: v.riskChecks.filter((c) => !c.passed).length,
  positionValueUsd: v.position?.valueUsd ?? null,
}));

const strategies = strategiesData as StrategiesData;
const protocols = protocolsData as ProtocolRow[];
const activity: ActivityData = { entries: ACTIVITY_ENTRIES };

// No protocolDetail here - app/api/protocols/[id]/route.ts queries the
// `protocols` table in Postgres directly. protocol-detail/*.json still
// exists as seed input for scripts/seed-db.ts, not served from here.
export const SEED = { overview, vaultList, strategies, protocols, activity };
