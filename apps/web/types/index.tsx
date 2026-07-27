
export interface ProtocolRow {
    id: string;            // "aave"
    name: string;          // "Aave"
    ticker: string;        // "AAVE"
    score: number;         // 0–100, current health score
    delta24h: number;      // score points vs 24h rolling avg, signed
    tvl: number;           // USD
    tvlDelta24h: number;   // percent, signed
    riskFlags: string[];   // e.g. ["whale outflow", "gov risk"]
  }