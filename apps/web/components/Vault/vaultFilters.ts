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

// Two shapes a vault's deposit can take: one token (single), or a claim on
// a pooled LP/pool token (lp - `vaultType` names it explicitly).
export function vaultKindOf(v: VaultSummary): VaultKind {
  return /\blp\b|pool/i.test(v.vaultType) ? "lp" : "single";
}

// A vault's real asset list - `underlyingAssets` for LP/pool vaults that
// are a claim on more than one token, or just `[asset]` for the ordinary
// single-deposit-asset case. Callers that need "every asset in this vault"
// (the asset filter, the row icon) go through this instead of reading
// `asset`/`underlyingAssets` directly, so there's one place that knows
// which field wins.
export function assetsOf(v: VaultInfo): string[] {
  return v.underlyingAssets && v.underlyingAssets.length > 0 ? v.underlyingAssets : [v.asset];
}

// There's no explicit risk-tier field on a vault - `riskFlagged` (count of
// failed risk checks, seed/index.ts) is the closest real signal for how
// aggressive a vault's posture is, so tiers derive from that instead of a
// fabricated field.
export function aggressivenessOf(v: VaultSummary): AggressivenessTier {
  if (v.riskFlagged === 0) return "conservative";
  if (v.riskFlagged <= 2) return "moderate";
  return "aggressive";
}
