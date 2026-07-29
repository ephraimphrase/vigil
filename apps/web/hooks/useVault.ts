// ─────────────────────────────────────────────────────────────
// Vault data seam. Static snapshot for now — swap for live vault reads
// (totalAssets / convertToShares / user balanceOf / adapter allocations).
// Page and components are unchanged when the source flips.
// ─────────────────────────────────────────────────────────────

import { MOCK_VAULT } from "../mocks/vault.mock";
import type { VaultData } from "@/types";

export function useVault(): VaultData {
  return MOCK_VAULT;
}
