import type { ProtocolRow } from "../types";

// Kept in sync with protocol-detail.json — every id here must have a
// matching entry there, or the detail page renders "Not found" on click.
export const MOCK_PROTOCOLS: ProtocolRow[] = [
  { id: "base",    name: "Base",           ticker: "—",   score: 86, delta24h: 0.4,  tvl: 3_900_000_000,  tvlDelta24h: -0.3, riskFlags: ["stage 0", "centralized sequencer"] },
  { id: "aave",    name: "Aave",           ticker: "AAVE", score: 79, delta24h: -1.2, tvl: 14_500_000_000, tvlDelta24h: -3.1, riskFlags: ["tvl drawdown", "governance dispute"] },
  { id: "uniswap", name: "Uniswap",        ticker: "UNI",  score: 88, delta24h: 0.8,  tvl: 4_500_000_000,  tvlDelta24h: 2.4,  riskFlags: ["unichain concentration", "v4 hook risk"] },
  { id: "lido",    name: "Lido",           ticker: "LDO",  score: 83, delta24h: 0.3,  tvl: 18_200_000_000, tvlDelta24h: 6.1,  riskFlags: ["market share erosion"] },
  { id: "sky",     name: "Sky (MakerDAO)", ticker: "SKY",  score: 81, delta24h: -0.2, tvl: 5_200_000_000,  tvlDelta24h: 0,    riskFlags: ["rwa counterparty", "usdc pass-through (psm)"] },
];
