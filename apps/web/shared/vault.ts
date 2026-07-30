// ─────────────────────────────────────────────────────────────
// Vault math — PURE. Deposit/withdraw previews and amount parsing. No
// React, no rounding surprises: shares and assets convert through
// sharePrice only. Mirrors ERC4626 previewDeposit / previewRedeem.
// ─────────────────────────────────────────────────────────────

// ─── UTILS ───
/** USDC in → shares minted. */
export const previewDeposit = (usdc: number, sharePrice: number): number =>
  sharePrice <= 0 ? 0 : usdc / sharePrice;

/** shares burned → USDC out. */
export const previewWithdraw = (shares: number, sharePrice: number): number =>
  shares * sharePrice;

/** Parse a user-typed amount to a non-negative number, or null if invalid. */
export function parseAmount(input: string): number | null {
  if (input.trim() === "") return null;
  const n = Number(input);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

// ─── AGGREGATES ───
// Dollar-weighted average across a vault's own allocation rows - same
// weighting shared/rebalance.ts's aggregate() uses for the (separate)
// global strategies domain, just typed to AllocationRow's fields. Each
// vault computes its own headline APY/health/deployed from its own
// allocation - never from another vault's or from the global strategies
// list - so a multi-vault picker can't show one vault's numbers on
// another's page.
export interface VaultAggregate {
  deployed: number;
  weightedHealth: number;
  weightedApy: number;
}

export function vaultAggregate(rows: { valueUsd: number; score: number; apy: number }[]): VaultAggregate {
  const deployed = rows.reduce((s, r) => s + r.valueUsd, 0);
  const w = (pick: (r: (typeof rows)[number]) => number) =>
    deployed === 0 ? 0 : rows.reduce((s, r) => s + pick(r) * r.valueUsd, 0) / deployed;
  return {
    deployed,
    weightedHealth: Math.round(w((r) => r.score)),
    weightedApy: w((r) => r.apy),
  };
}
