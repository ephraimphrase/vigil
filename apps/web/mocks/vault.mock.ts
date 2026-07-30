// ─────────────────────────────────────────────────────────────
// Vault mock. Pooled "Balanced" vault. Allocation ids match the detail /
// strategy mocks. excludedProtocols references the low-score risky ones
// from the detail set. Swap for live reads.
// ─────────────────────────────────────────────────────────────

import type { VaultData } from "@/types";

export const MOCK_VAULT: VaultData = {
  info: {
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
};
