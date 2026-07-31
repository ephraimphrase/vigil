// ─────────────────────────────────────────────────────────────
// Vault data seam. Fetches one vault from /api/vault/:slug - mock-backed
// today (seed/index.ts), swaps for a live vault read (totalAssets /
// convertToShares / user balanceOf / adapter allocations) later without
// touching callers. `data` is undefined while loading OR when no vault
// matches the slug - check `isLoading` to tell those apart (loading first,
// then a real not-found if data is still undefined once it's false).
// ─────────────────────────────────────────────────────────────

import { useApi, type ApiResult } from "./useApi";
import type { VaultData } from "../types";

export function useVault(slug: string): ApiResult<VaultData | undefined> {
  return useApi<VaultData | undefined>(`/api/vault/${slug}`, undefined);
}
