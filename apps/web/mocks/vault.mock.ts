// ─────────────────────────────────────────────────────────────
// Vault mock. Pooled "Balanced" vault. Allocation ids match the detail /
// strategy mocks. excludedProtocols references the low-score risky ones
// from the detail set. Swap for live reads.
// ─────────────────────────────────────────────────────────────

import type { VaultData } from "@/types";

export const MOCK_VAULT: VaultData = {
  info: {
    asset: "USDC",
    totalAssets: 48250,
    totalShares: 47120.11,
    sharePrice: 1.024,
    idle: 0,
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
    { protocolId: "aave",    name: "Aave",    category: "lending", targetWeight: 0.30, actualWeight: 0.348, valueUsd: 16800, score: 79 },
    { protocolId: "lido",    name: "Lido",    category: "lsd",     targetWeight: 0.30, actualWeight: 0.294, valueUsd: 14200, score: 83 },
    { protocolId: "sky",     name: "Sky",     category: "cdp",     targetWeight: 0.25, actualWeight: 0.251, valueUsd: 12100, score: 81 },
    { protocolId: "uniswap", name: "Uniswap", category: "dex",     targetWeight: 0.15, actualWeight: 0.107, valueUsd: 5150,  score: 88 },
  ],
};
