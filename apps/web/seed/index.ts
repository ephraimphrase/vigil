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
// entry via getVault(); the /dashboard/vault picker reads from Ponder
// instead (app/api/vaults/route.ts).
// ─────────────────────────────────────────────────────────────

import moment from "moment";
import type { OverviewData, StrategiesData, ProtocolRow, VaultData, VaultHistoryPoint, VaultSummary, ActivityData, TransactionsData } from "../types";
import { vaultAggregate } from "../shared/vault";
import { ACTIVITY_ENTRIES } from "./activity";
import { TRANSACTION_ENTRIES } from "./transactions";

import strategiesData from "./strategies.json";
import protocolsData from "./protocols.json";

const iso = (minsAgo: number) => moment().subtract(minsAgo, "minutes").toISOString();

// Deterministic ~12-month ramp toward each vault's real headline apy/tvl
// (vaultAggregate(...).weightedApy, info.tvl) - no randomness, so the seed
// stays stable across reloads, and the chart's endpoint always matches the
// masthead numbers instead of drifting from them.
function buildVaultHistory(targetApy: number, targetTvl: number): VaultHistoryPoint[] {
  const months = 11;
  const points: VaultHistoryPoint[] = [];
  let cumulativePerf = 0;
  for (let i = months; i >= 0; i--) {
    const progress = (months - i) / months; // 0 -> 1
    const apy30d = Number((targetApy * (0.7 + 0.3 * progress)).toFixed(2));
    const tvl = Math.round(targetTvl * (0.6 + 0.4 * progress));
    cumulativePerf = Number((cumulativePerf + apy30d / 12).toFixed(2));
    points.push({ ts: iso(60 * 24 * 30 * i), apy30d, performance: cumulativePerf, tvl });
  }
  return points;
}

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
      name: "USDC (Conservative)",
      asset: "USDC",
      totalAssets: 512_000,
      totalShares: 496_606.21,
      sharePrice: 1.031,
      idle: 18_000,
      tvl: 512_000,
      benchmarkDeltaPct: 1.4,
      chain: "Ethereum",
      description:
        "A capital-preservation-first allocator that spreads USDC across the highest-health, lowest-volatility protocols in Vigil's universe — Aave, Lido, and Sky — rebalancing automatically as health scores move.",
      assetType: "stablecoin",
      vaultType: "Managed Vault",
      vaultContractAddress: "0x4b1B4413E6D1c5B4e5A2F6E7c3E2C1a8F0D9B7A6",
      tokenContractAddress: "0x1a2B3c4D5e6F7089aBcDeF0123456789aBcDeF0",
      managementFeePct: 0,
      performanceFeePct: 0.10,
      deployedOn: "2023-03-14T00:00:00.000Z",
      features: ["Auto-compounding", "Autonomous rebalancing"],
      docs: {
        userDocsUrl: "https://docs.vigil.xyz/vaults/conservative",
        devDocsUrl: "https://docs.vigil.xyz/dev/vaults",
        analyticsUrl: "https://analytics.vigil.xyz/vaults/conservative",
        apiUrl: "https://api.vigil.xyz/vaults/conservative/snapshot",
      },
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
    history: buildVaultHistory(3.94, 512_000),
  },
  balanced: {
    info: {
      slug: "balanced",
      name: "USDC (Balanced)",
      asset: "USDC",
      totalAssets: 74_500,
      totalShares: 72_753.91,
      sharePrice: 1.024,
      idle: 3_350,
      tvl: 74_500,
      benchmarkDeltaPct: 2.1,
      chain: "Ethereum",
      description:
        "The default allocator — diversifies USDC across nine protocols spanning lending, LSDs, DEX LPs, and CDPs, reweighting toward whichever combination of yield and health currently earns its place.",
      assetType: "stablecoin",
      vaultType: "Managed Vault",
      vaultContractAddress: "0x7C8d9E0f1A2b3C4d5E6f7089aBcDeF012345678",
      tokenContractAddress: "0x9F0e1D2c3B4a5968778695A4B3C2D1E0F9A8B7C",
      managementFeePct: 0,
      performanceFeePct: 0.10,
      deployedOn: "2022-11-02T00:00:00.000Z",
      features: ["Auto-compounding", "Autonomous rebalancing", "Multi-protocol diversification"],
      docs: {
        userDocsUrl: "https://docs.vigil.xyz/vaults/balanced",
        devDocsUrl: "https://docs.vigil.xyz/dev/vaults",
        analyticsUrl: "https://analytics.vigil.xyz/vaults/balanced",
        apiUrl: "https://api.vigil.xyz/vaults/balanced/snapshot",
      },
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
    history: buildVaultHistory(6.08, 74_500),
  },
  degen: {
    info: {
      slug: "degen",
      name: "USDC (Degen)",
      asset: "USDC",
      totalAssets: 286_000,
      totalShares: 280_943.03,
      sharePrice: 1.018,
      idle: 9_000,
      tvl: 286_000,
      benchmarkDeltaPct: -1.8,
      chain: "Ethereum",
      description:
        "The highest-conviction allocator — concentrates USDC into the strongest-yielding DEX and lending pairs, trading a wider drawdown band for the biggest upside among Vigil's three tiers.",
      assetType: "stablecoin",
      vaultType: "Managed Vault",
      vaultContractAddress: "0x2E3f4A5b6C7d8E9f0123456789aBcDeF0123456",
      tokenContractAddress: "0x5B6c7D8e9F0a1B2c3D4e5F6789aBcDeF0abcdef",
      managementFeePct: 0,
      performanceFeePct: 0.10,
      deployedOn: "2023-07-19T00:00:00.000Z",
      features: ["Auto-compounding", "Autonomous rebalancing"],
      docs: {
        userDocsUrl: "https://docs.vigil.xyz/vaults/degen",
        devDocsUrl: "https://docs.vigil.xyz/dev/vaults",
        analyticsUrl: "https://analytics.vigil.xyz/vaults/degen",
        apiUrl: "https://api.vigil.xyz/vaults/degen/snapshot",
      },
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
    history: buildVaultHistory(7.22, 286_000),
  },
  "weth-core": {
    info: {
      slug: "weth-core",
      name: "WETH (Core)",
      asset: "WETH",
      totalAssets: 128_000,
      totalShares: 41_230.55,
      sharePrice: 3.104,
      idle: 4_100,
      tvl: 128_000,
      benchmarkDeltaPct: 0.9,
      chain: "Ethereum",
      description:
        "An ETH-native allocator — splits WETH between Lido staking and blue-chip lending markets, favoring the same health-score discipline as the USDC tiers but denominated in ETH.",
      assetType: "volatile",
      vaultType: "Managed Vault",
      vaultContractAddress: "0x8A1b2C3d4E5f6789aBcDeF0123456789aBcDeF1",
      tokenContractAddress: "0x2C3d4E5f6789aBcDeF0123456789aBcDeF12345",
      managementFeePct: 0,
      performanceFeePct: 0.10,
      deployedOn: "2024-02-08T00:00:00.000Z",
      features: ["Auto-compounding", "Autonomous rebalancing", "Multi-protocol diversification"],
      docs: {
        userDocsUrl: "https://docs.vigil.xyz/vaults/weth-core",
        devDocsUrl: "https://docs.vigil.xyz/dev/vaults",
        analyticsUrl: "https://analytics.vigil.xyz/vaults/weth-core",
        apiUrl: "https://api.vigil.xyz/vaults/weth-core/snapshot",
      },
    },
    policy: {
      name: "Core",
      maxWeightPerProtocol: 0.45,
      exitFloorScore: 65,
      cooldownHours: 4,
      autonomyDefault: "auto",
      excludedProtocols: ["radiant", "hundred"],
    },
    position: null,
    allocation: [
      { protocolId: "lido", name: "Lido", category: "lsd", targetWeight: 0.45, actualWeight: 0.45, valueUsd: 57_600, score: 83, apy: 3.1 },
      { protocolId: "aave", name: "Aave", category: "lending", targetWeight: 0.35, actualWeight: 0.35, valueUsd: 44_800, score: 79, apy: 4.8 },
      { protocolId: "compound", name: "Compound", category: "lending", targetWeight: 0.20, actualWeight: 0.20, valueUsd: 25_600, score: 87, apy: 4.3 },
    ],
    riskChecks: [
      { id: "audited", label: "Underlying strategies audited", passed: true },
      { id: "timelock", label: "Vault upgrades behind timelock", passed: true },
      { id: "oracle", label: "No single-oracle dependency", passed: true, note: "Lido's wstETH rate reads from the token contract; Aave and Compound both price WETH off Chainlink." },
      { id: "concentration", label: "No protocol above the policy cap", passed: true },
      { id: "admin-keys", label: "Admin keys held by a multisig, not an EOA", passed: true, note: "Vault owner is a 3-of-5 Gnosis Safe." },
    ],
    history: buildVaultHistory(3.86, 128_000),
  },
  "wbtc-core": {
    info: {
      slug: "wbtc-core",
      name: "WBTC (Core)",
      asset: "WBTC",
      totalAssets: 95_000,
      totalShares: 1_612.4,
      sharePrice: 58.9,
      idle: 2_800,
      tvl: 95_000,
      benchmarkDeltaPct: -0.4,
      chain: "Ethereum",
      description:
        "A BTC-denominated allocator — lends WBTC across Aave and Compound's most liquid markets, the narrowest protocol set of any tier since BTC collateral options in Vigil's universe are limited to lending.",
      assetType: "volatile",
      vaultType: "Managed Vault",
      vaultContractAddress: "0x3d4E5f6789aBcDeF0123456789aBcDeF1234567",
      tokenContractAddress: "0x5f6789aBcDeF0123456789aBcDeF123456789aB",
      managementFeePct: 0,
      performanceFeePct: 0.10,
      deployedOn: "2024-05-21T00:00:00.000Z",
      features: ["Auto-compounding", "Autonomous rebalancing"],
      docs: {
        userDocsUrl: "https://docs.vigil.xyz/vaults/wbtc-core",
        devDocsUrl: "https://docs.vigil.xyz/dev/vaults",
        analyticsUrl: "https://analytics.vigil.xyz/vaults/wbtc-core",
        apiUrl: "https://api.vigil.xyz/vaults/wbtc-core/snapshot",
      },
    },
    policy: {
      name: "Core",
      maxWeightPerProtocol: 0.60,
      exitFloorScore: 65,
      cooldownHours: 4,
      autonomyDefault: "auto",
      excludedProtocols: ["radiant", "hundred"],
    },
    position: null,
    allocation: [
      { protocolId: "aave", name: "Aave", category: "lending", targetWeight: 0.55, actualWeight: 0.55, valueUsd: 52_250, score: 79, apy: 4.8 },
      { protocolId: "compound", name: "Compound", category: "lending", targetWeight: 0.45, actualWeight: 0.45, valueUsd: 42_750, score: 87, apy: 4.3 },
    ],
    riskChecks: [
      { id: "audited", label: "Underlying strategies audited", passed: true },
      { id: "timelock", label: "Vault upgrades behind timelock", passed: true },
      { id: "oracle", label: "No single-oracle dependency", passed: false, note: "Both legs price WBTC off Chainlink's single BTC/USD feed - no secondary source if that feed stalls." },
      { id: "concentration", label: "No protocol above the policy cap", passed: true },
      { id: "admin-keys", label: "Admin keys held by a multisig, not an EOA", passed: true, note: "Vault owner is a 3-of-5 Gnosis Safe." },
    ],
    history: buildVaultHistory(4.59, 95_000),
  },
  "dai-yield": {
    info: {
      slug: "dai-yield",
      name: "DAI (Yield)",
      asset: "DAI",
      totalAssets: 210_000,
      totalShares: 203_046.02,
      sharePrice: 1.034,
      idle: 6_500,
      tvl: 210_000,
      benchmarkDeltaPct: 1.6,
      chain: "Ethereum",
      description:
        "A DAI-native allocator anchored on Sky, DAI's own issuer, then rounded out with Aave and Morpho lending markets for the rest.",
      assetType: "stablecoin",
      vaultType: "Managed Vault",
      vaultContractAddress: "0x789aBcDeF0123456789aBcDeF123456789aBcDe",
      tokenContractAddress: "0xaBcDeF0123456789aBcDeF123456789aBcDeF01",
      managementFeePct: 0,
      performanceFeePct: 0.10,
      deployedOn: "2023-09-12T00:00:00.000Z",
      features: ["Auto-compounding", "Autonomous rebalancing", "Multi-protocol diversification"],
      docs: {
        userDocsUrl: "https://docs.vigil.xyz/vaults/dai-yield",
        devDocsUrl: "https://docs.vigil.xyz/dev/vaults",
        analyticsUrl: "https://analytics.vigil.xyz/vaults/dai-yield",
        apiUrl: "https://api.vigil.xyz/vaults/dai-yield/snapshot",
      },
    },
    policy: {
      name: "Yield",
      maxWeightPerProtocol: 0.50,
      exitFloorScore: 70,
      cooldownHours: 3,
      autonomyDefault: "auto",
      excludedProtocols: ["radiant", "hundred"],
    },
    position: null,
    allocation: [
      { protocolId: "sky", name: "Sky", category: "cdp", targetWeight: 0.50, actualWeight: 0.50, valueUsd: 105_000, score: 81, apy: 3.75 },
      { protocolId: "aave", name: "Aave", category: "lending", targetWeight: 0.30, actualWeight: 0.30, valueUsd: 63_000, score: 79, apy: 4.8 },
      { protocolId: "morpho", name: "Morpho", category: "lending", targetWeight: 0.20, actualWeight: 0.20, valueUsd: 42_000, score: 85, apy: 5.5 },
    ],
    riskChecks: [
      { id: "audited", label: "Underlying strategies audited", passed: true },
      { id: "timelock", label: "Vault upgrades behind timelock", passed: true },
      { id: "oracle", label: "No single-oracle dependency", passed: true, note: "Sky, Aave, and Morpho all price DAI off independent Chainlink feeds." },
      { id: "concentration", label: "No protocol above the policy cap", passed: true },
      { id: "admin-keys", label: "Admin keys held by a multisig, not an EOA", passed: true, note: "Vault owner is a 3-of-5 Gnosis Safe." },
    ],
    history: buildVaultHistory(4.44, 210_000),
  },
  "usdt-balanced": {
    info: {
      slug: "usdt-balanced",
      name: "USDT (Balanced)",
      asset: "USDT",
      totalAssets: 63_000,
      totalShares: 61_012.4,
      sharePrice: 1.033,
      idle: 2_200,
      tvl: 63_000,
      benchmarkDeltaPct: 0.7,
      chain: "Base",
      description:
        "Vigil's first non-Ethereum tier — a USDT allocator on Base spread across lending and a cross-chain LP leg, trading a wider protocol set for a newer, thinner deployment.",
      assetType: "stablecoin",
      vaultType: "Managed Vault",
      vaultContractAddress: "0xcDeF0123456789aBcDeF123456789aBcDeF0123",
      tokenContractAddress: "0xeF0123456789aBcDeF123456789aBcDeF012345",
      managementFeePct: 0,
      performanceFeePct: 0.10,
      deployedOn: "2024-08-30T00:00:00.000Z",
      features: ["Auto-compounding", "Autonomous rebalancing", "Multi-protocol diversification"],
      docs: {
        userDocsUrl: "https://docs.vigil.xyz/vaults/usdt-balanced",
        devDocsUrl: "https://docs.vigil.xyz/dev/vaults",
        analyticsUrl: "https://analytics.vigil.xyz/vaults/usdt-balanced",
        apiUrl: "https://api.vigil.xyz/vaults/usdt-balanced/snapshot",
      },
    },
    policy: {
      name: "Balanced",
      maxWeightPerProtocol: 0.40,
      exitFloorScore: 60,
      cooldownHours: 6,
      autonomyDefault: "auto",
      excludedProtocols: ["radiant", "hundred"],
    },
    position: null,
    allocation: [
      { protocolId: "aave", name: "Aave", category: "lending", targetWeight: 0.40, actualWeight: 0.40, valueUsd: 25_200, score: 79, apy: 4.8 },
      { protocolId: "venus", name: "Venus", category: "lending", targetWeight: 0.35, actualWeight: 0.35, valueUsd: 22_050, score: 74, apy: 6.1 },
      { protocolId: "stargate", name: "Stargate", category: "dex", targetWeight: 0.25, actualWeight: 0.25, valueUsd: 15_750, score: 86, apy: 4.2 },
    ],
    riskChecks: [
      { id: "audited", label: "Underlying strategies audited", passed: true },
      { id: "timelock", label: "Vault upgrades behind timelock", passed: true },
      { id: "oracle", label: "No single-oracle dependency", passed: true, note: "All three legs price USDT off independent Chainlink feeds on Base." },
      { id: "concentration", label: "No protocol above the policy cap", passed: true },
      { id: "admin-keys", label: "Admin keys held by a multisig, not an EOA", passed: false, note: "Vault owner is currently a 2-of-3 multisig pending migration to a Gnosis Safe." },
    ],
    history: buildVaultHistory(5.16, 63_000),
  },
  "steth-eth-lp": {
    info: {
      slug: "steth-eth-lp",
      name: "stETH-ETH LP",
      asset: "stETH-ETH LP",
      underlyingAssets: ["stETH", "ETH"],
      totalAssets: 41_000,
      totalShares: 38_190.7,
      sharePrice: 1.074,
      idle: 900,
      tvl: 41_000,
      benchmarkDeltaPct: -2.3,
      chain: "Ethereum",
      description:
        "Vigil's only LP-token vault - deposits into the stETH-ETH pool itself rather than lending the underlying, splitting the position across Curve and Uniswap for depth. Widest drawdown band of any tier.",
      assetType: "volatile",
      vaultType: "LP Vault",
      vaultContractAddress: "0x0123456789aBcDeF123456789aBcDeF01234567",
      tokenContractAddress: "0x23456789aBcDeF123456789aBcDeF0123456789",
      managementFeePct: 0,
      performanceFeePct: 0.15,
      deployedOn: "2024-11-04T00:00:00.000Z",
      features: ["Auto-compounding", "Autonomous rebalancing"],
      docs: {
        userDocsUrl: "https://docs.vigil.xyz/vaults/steth-eth-lp",
        devDocsUrl: "https://docs.vigil.xyz/dev/vaults",
        analyticsUrl: "https://analytics.vigil.xyz/vaults/steth-eth-lp",
        apiUrl: "https://api.vigil.xyz/vaults/steth-eth-lp/snapshot",
      },
    },
    policy: {
      name: "LP",
      maxWeightPerProtocol: 0.65,
      exitFloorScore: 45,
      cooldownHours: 2,
      autonomyDefault: "alert",
      excludedProtocols: ["radiant", "hundred"],
    },
    position: null,
    allocation: [
      { protocolId: "curve", name: "Curve", category: "dex", targetWeight: 0.60, actualWeight: 0.60, valueUsd: 24_600, score: 82, apy: 5.8 },
      { protocolId: "uniswap", name: "Uniswap", category: "dex", targetWeight: 0.40, actualWeight: 0.40, valueUsd: 16_400, score: 88, apy: 9.2 },
    ],
    riskChecks: [
      { id: "audited", label: "Underlying strategies audited", passed: true },
      { id: "timelock", label: "Vault upgrades behind timelock", passed: false, note: "LP tier ships changes faster than the lending tiers - upgrades land without a timelock delay." },
      { id: "oracle", label: "No single-oracle dependency", passed: false, note: "Both legs price stETH off the pool's own spot ratio, not an external oracle - exposed to intra-block manipulation during thin liquidity." },
      { id: "concentration", label: "No protocol above the policy cap", passed: true },
      { id: "admin-keys", label: "Admin keys held by a multisig, not an EOA", passed: false, note: "Vault owner is currently a 2-of-3 multisig pending migration to a Gnosis Safe." },
    ],
    history: buildVaultHistory(7.16, 41_000),
  },
  "blue-chip-basket": {
    info: {
      slug: "blue-chip-basket",
      name: "Blue Chip Basket",
      asset: "Blue Chip Basket",
      underlyingAssets: ["WETH", "WBTC", "USDC"],
      totalAssets: 152_000,
      totalShares: 141_875.3,
      sharePrice: 1.071,
      idle: 5_300,
      tvl: 152_000,
      benchmarkDeltaPct: 1.1,
      chain: "Ethereum",
      description:
        "Vigil's first basket vault - holds WETH, WBTC, and USDC directly rather than through a pooled LP token, each leg allocated to its own protocols. Not an LP position: no pool-depeg or impermanent-loss exposure, just three separate holdings under one policy.",
      assetType: "volatile",
      vaultType: "Basket Vault",
      vaultContractAddress: "0x456789aBcDeF123456789aBcDeF0123456789ab",
      tokenContractAddress: "0x6789aBcDeF0123456789aBcDeF0123456789abc",
      managementFeePct: 0,
      performanceFeePct: 0.12,
      deployedOn: "2025-01-15T00:00:00.000Z",
      features: ["Auto-compounding", "Autonomous rebalancing", "Multi-protocol diversification"],
      docs: {
        userDocsUrl: "https://docs.vigil.xyz/vaults/blue-chip-basket",
        devDocsUrl: "https://docs.vigil.xyz/dev/vaults",
        analyticsUrl: "https://analytics.vigil.xyz/vaults/blue-chip-basket",
        apiUrl: "https://api.vigil.xyz/vaults/blue-chip-basket/snapshot",
      },
    },
    policy: {
      name: "Basket",
      maxWeightPerProtocol: 0.40,
      exitFloorScore: 60,
      cooldownHours: 5,
      autonomyDefault: "auto",
      excludedProtocols: ["radiant", "hundred"],
    },
    position: null,
    allocation: [
      { protocolId: "lido", name: "Lido", category: "lsd", targetWeight: 0.35, actualWeight: 0.35, valueUsd: 53_200, score: 83, apy: 3.1 },
      { protocolId: "aave", name: "Aave", category: "lending", targetWeight: 0.35, actualWeight: 0.35, valueUsd: 53_200, score: 79, apy: 4.8 },
      { protocolId: "compound", name: "Compound", category: "lending", targetWeight: 0.30, actualWeight: 0.30, valueUsd: 45_600, score: 87, apy: 4.3 },
    ],
    riskChecks: [
      { id: "audited", label: "Underlying strategies audited", passed: true },
      { id: "timelock", label: "Vault upgrades behind timelock", passed: true },
      { id: "oracle", label: "No single-oracle dependency", passed: true, note: "Each leg prices off its own independent Chainlink feed - no shared dependency across the basket." },
      { id: "concentration", label: "No protocol above the policy cap", passed: true },
      { id: "admin-keys", label: "Admin keys held by a multisig, not an EOA", passed: false, note: "Vault owner is currently a 2-of-3 multisig pending migration to a Gnosis Safe." },
    ],
    history: buildVaultHistory(4.06, 152_000),
  },
};

export function getVault(slug: string): VaultData | undefined {
  return VAULT_MOCKS[slug];
}

const vaultList: VaultSummary[] = Object.values(VAULT_MOCKS).map((v) => ({
  ...v.info,
  apy: vaultAggregate(v.allocation).weightedApy,
  score: vaultAggregate(v.allocation).weightedHealth,
  riskFlagged: v.riskChecks.filter((c) => !c.passed).length,
  positionValueUsd: v.position?.valueUsd ?? null,
  positionPnlUsd: v.position?.pnlUsd ?? null,
}));

const strategies = strategiesData as StrategiesData;
const protocols = protocolsData as ProtocolRow[];
const activity: ActivityData = { entries: ACTIVITY_ENTRIES };
const transactions: TransactionsData = { entries: TRANSACTION_ENTRIES };

// No protocolDetail here - app/api/protocols/[id]/route.ts queries the
// `protocols` table in Postgres directly. protocol-detail/*.json still
// exists as seed input for scripts/seed-db.ts, not served from here.
export const SEED = { overview, vaultList, strategies, protocols, activity, transactions };
