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
