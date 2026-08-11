// ─────────────────────────────────────────────────────────────
// Vault data seam. Fetches one vault from /api/vault/:slug - Ponder-backed
// (lib/ponder/mappers/vaultData.ts); position/allocation/riskChecks/history
// are still placeholders until wallet reads and protocol correlation are
// wired up. `data` is undefined while loading OR when no vault matches the
// slug - check `isLoading` to tell those apart (loading first, then a real
// not-found if data is still undefined once it's false).
// ─────────────────────────────────────────────────────────────

import { useApi, type ApiResult } from "./useApi";
import type { VaultData } from "../types";

export function useVault(slug: string): ApiResult<VaultData | undefined> {
  return useApi<VaultData | undefined>(`/api/vault/${slug}`, undefined);
}
