// ─────────────────────────────────────────────────────────────
// Vault data seam. Fetches one vault from /api/vault/:slug - Ponder-backed
// (lib/ponder/mappers/vaultData.ts); allocation/riskChecks/history are
// still placeholders until protocol correlation is wired up. `data` is
// undefined while loading OR when no vault matches the slug - check
// `isLoading` to tell those apart (loading first, then a real not-found if
// data is still undefined once it's false).
//
// Polls every 15s so tvl/apy - which move as other wallets deposit/
// withdraw or a keeper rebalances, not just your own actions - don't go
// stale for as long as the tab sits open. `refetch` is also exposed so a
// caller who just submitted their own deposit/withdraw can force an
// immediate refresh instead of waiting out the interval.
// ─────────────────────────────────────────────────────────────

import { useApi, type ApiResult } from "./useApi";
import type { VaultData } from "../types";

const REFETCH_INTERVAL_MS = 15_000;

export function useVault(slug: string): ApiResult<VaultData | undefined> {
  return useApi<VaultData | undefined>(`/api/vault/${slug}`, undefined, REFETCH_INTERVAL_MS);
}
