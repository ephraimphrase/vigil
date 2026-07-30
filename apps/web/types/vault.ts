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
}

export interface VaultData {
  info: VaultInfo;
  policy: VaultPolicy;
  position: UserPosition | null;
  allocation: AllocationRow[];
}
