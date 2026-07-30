// ─────────────────────────────────────────────────────────────
// Vault data seam. Static snapshot for now — swap for live vault reads
// (totalAssets / convertToShares / user balanceOf / adapter allocations).
// Page and components are unchanged when the source flips.
// ─────────────────────────────────────────────────────────────

import { useApi } from "./useApi";
import type { VaultData } from "@/types";

const EMPTY: VaultData = {
  info: { asset: "", totalAssets: 0, totalShares: 0, sharePrice: 0, idle: 0, tvl: 0, benchmarkDeltaPct: 0 },
  policy: { name: "", maxWeightPerProtocol: 0, exitFloorScore: 0, cooldownHours: 0, autonomyDefault: "watch", excludedProtocols: [] },
  position: null,
  allocation: [],
};

export function useVault(): VaultData {
  return useApi("/api/vault", EMPTY);
}
