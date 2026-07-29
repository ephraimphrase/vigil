import type { StrategiesData } from "../types";

const now = Date.now();
const iso = (h: number) => new Date(now - h * 3_600_000).toISOString();

export const MOCK_STRATEGIES: StrategiesData = {
  vault: { asset: "USDC", totalAssets: 48250, idle: 0 },
  strategies: [
    { protocolId: "aave",    name: "Aave",    category: "lending", adapter: "0x7a1f...9c02", asset: "USDC", allocated: 16800, targetWeight: 0.30, actualWeight: 0.348, score: 79, apy: 4.8,  lastRebalance: iso(8),  status: "active" },
    { protocolId: "lido",    name: "Lido",    category: "lsd",     adapter: "0x3b8e...41aa", asset: "USDC", allocated: 14200, targetWeight: 0.30, actualWeight: 0.294, score: 83, apy: 3.1,  lastRebalance: iso(26), status: "active" },
    { protocolId: "sky",     name: "Sky",     category: "cdp",     adapter: "0x56c0...7d19", asset: "USDC", allocated: 12100, targetWeight: 0.25, actualWeight: 0.251, score: 81, apy: 3.75, lastRebalance: iso(26), status: "active" },
    { protocolId: "uniswap", name: "Uniswap", category: "dex",     adapter: "0x1f98...8aaf", asset: "USDC", allocated: 5150,  targetWeight: 0.15, actualWeight: 0.107, score: 88, apy: 9.2,  lastRebalance: iso(50), status: "active" },
  ],
};
