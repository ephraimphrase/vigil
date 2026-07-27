import type { ProtocolRow } from "../types";

export const MOCK_PROTOCOLS: ProtocolRow[] = [
  { id: "aave",      name: "Aave",       ticker: "AAVE", score: 91, delta24h: 1.2,   tvl: 12_400_000_000, tvlDelta24h: 0.8,  riskFlags: [] },
  { id: "lido",      name: "Lido",       ticker: "LDO",  score: 88, delta24h: -0.4,  tvl: 22_100_000_000, tvlDelta24h: -0.3, riskFlags: [] },
  { id: "makerdao",  name: "MakerDAO",   ticker: "MKR",  score: 84, delta24h: 0.6,   tvl: 8_900_000_000,  tvlDelta24h: 1.1,  riskFlags: [] },
  { id: "uniswap",   name: "Uniswap",    ticker: "UNI",  score: 82, delta24h: 2.1,   tvl: 5_600_000_000,  tvlDelta24h: 3.4,  riskFlags: ["gov proposal"] },
  { id: "curve",     name: "Curve",      ticker: "CRV",  score: 71, delta24h: -6.8,  tvl: 2_300_000_000,  tvlDelta24h: -4.2, riskFlags: ["tvl outflow"] },
  { id: "compound",  name: "Compound",   ticker: "COMP", score: 68, delta24h: -3.1,  tvl: 1_800_000_000,  tvlDelta24h: -2.0, riskFlags: ["dev velocity"] },
  { id: "convex",    name: "Convex",     ticker: "CVX",  score: 63, delta24h: -8.9,  tvl: 1_100_000_000,  tvlDelta24h: -6.7, riskFlags: ["whale outflow", "tvl outflow"] },
  { id: "frax",      name: "Frax",       ticker: "FXS",  score: 57, delta24h: -12.4, tvl: 640_000_000,    tvlDelta24h: -9.1, riskFlags: ["depeg watch"] },
  { id: "gmx",       name: "GMX",        ticker: "GMX",  score: 52, delta24h: -4.6,  tvl: 480_000_000,    tvlDelta24h: -3.3, riskFlags: ["sentiment", "liq spike"] },
  { id: "pendle",    name: "Pendle",     ticker: "PENDLE", score: 49, delta24h: -18.2, tvl: 310_000_000, tvlDelta24h: -14.0, riskFlags: ["whale outflow", "sec news", "liq spike"] },
  { id: "radiant",   name: "Radiant",    ticker: "RDNT", score: 38, delta24h: -22.7, tvl: 84_000_000,     tvlDelta24h: -19.4, riskFlags: ["exploit news", "team exit"] },
  { id: "hundred",   name: "Hundred Fin",ticker: "HND", score: 24, delta24h: -31.0, tvl: 12_000_000,   tvlDelta24h: -28.5, riskFlags: ["contract paused", "whale outflow"] },
];