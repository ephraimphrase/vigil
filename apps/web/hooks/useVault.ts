// ─────────────────────────────────────────────────────────────
// Vault data seam. Fetches one vault from /api/vault/:slug - mock-backed
// today (seed/index.ts), swaps for a live vault read (totalAssets /
// convertToShares / user balanceOf / adapter allocations) later without
// touching callers. undefined = loading or no vault matches the slug,
// same convention as useProtocolDetail.
// ─────────────────────────────────────────────────────────────

import { useApi } from "./useApi";
import type { VaultData } from "../types";

export function useVault(slug: string): VaultData | undefined {
  return useApi<VaultData | undefined>(`/api/vault/${slug}`, undefined);
}
