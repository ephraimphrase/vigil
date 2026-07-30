import type { Category } from "./shared";

export type AutonomyLevel = "watch" | "alert" | "approve" | "auto";

export interface VaultPolicy {
  name: string;
  maxWeightPerProtocol: number;
  exitFloorScore: number;
  cooldownHours: number;
  autonomyDefault: AutonomyLevel;
  excludedProtocols: string[];
}

export interface VaultInfo {
  slug: string;
  name: string;
  asset: string;
  totalAssets: number;
  totalShares: number;
  sharePrice: number;
  idle: number;
  tvl: number;
  benchmarkDeltaPct: number;
}

export interface UserPosition {
  shares: number;
  valueUsd: number;
  costBasisUsd: number;
  pnlUsd: number;
  walletUsdc: number;
}

export interface AllocationRow {
  protocolId: string;
  name: string;
  category: Category;
  targetWeight: number;
  actualWeight: number;
  valueUsd: number;
  score: number;
  apy: number;
}

// Beefy-checklist-style pass/fail row - vault-level (the strategy set as a
// whole), not per-protocol. Distinct from protocols' severity-graded RiskRow
// (see types/protocols.ts) - a different question (did this pass a fixed
// gate? vs. how severe is this open issue?).
export interface RiskCheckRow {
  id: string;
  label: string;
  passed: boolean;
  note?: string;
}

export interface VaultData {
  info: VaultInfo;
  policy: VaultPolicy;
  position: UserPosition | null;
  allocation: AllocationRow[];
  riskChecks: RiskCheckRow[];
}

// Row shape for the /dashboard/vault picker. `apy` is derived from the
// vault's own allocation (vaultAggregate, shared/vault.ts); `riskFlagged`
// from its own riskChecks; `positionValueUsd` from its own position - all
// computed once at seed-build time from that same vault's VaultData, never
// hand-entered a second time.
export interface VaultSummary extends VaultInfo {
  apy: number;
  riskFlagged: number;
  positionValueUsd: number | null;
}
