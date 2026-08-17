import type { VaultInfo, VaultSummary } from "@/types";

export type AggressivenessTier = "conservative" | "moderate" | "aggressive";
type AssetCategory = VaultInfo["assetType"];

export interface VaultFilterState {
  assetFilter: string[];
  minTvl: number;
  categoryFilter: AssetCategory[];
  aggressivenessFilter: AggressivenessTier[];
}

export const EMPTY_ADVANCED_FILTERS: VaultFilterState = {
  assetFilter: [],
  minTvl: 500,
  categoryFilter: [],
  aggressivenessFilter: [],
};

export type VaultKind = "single" | "lp";

export function vaultKindOf(v: VaultSummary): VaultKind {
  return /\blp\b|pool/i.test(v.vaultType) ? "lp" : "single";
}

export function assetsOf(v: VaultInfo): string[] {
  return v.underlyingAssets && v.underlyingAssets.length > 0 ? v.underlyingAssets : [v.asset];
}

export function aggressivenessOf(v: VaultSummary): AggressivenessTier {
  if (v.riskFlagged === 0) return "conservative";
  if (v.riskFlagged <= 2) return "moderate";
  return "aggressive";
}
