import { toTokens } from "thirdweb";

interface FlowEvent {
  assets: string;
}

// Net of deposits minus withdrawals, in asset units - the cost-basis half
// of a position's P&L. Callers are responsible for pre-filtering `deposits`/
// `withdrawals` down to the (vault, owner) pair they care about - this is
// pure arithmetic over whatever's handed in. The live half (current value)
// needs an on-chain maxWithdraw/balanceOf read, which the caller does
// itself. Shared by the cross-vault portfolio route (mappers/portfolio.ts)
// and the single-vault route so there's one formula, not two that can
// drift.
export function netCostBasisAssets(deposits: FlowEvent[], withdrawals: FlowEvent[], decimals: number): number {
  const depositedRaw = deposits.reduce((sum, d) => sum + BigInt(d.assets), 0n);
  const withdrawnRaw = withdrawals.reduce((sum, w) => sum + BigInt(w.assets), 0n);
  const netRaw = depositedRaw > withdrawnRaw ? depositedRaw - withdrawnRaw : 0n;
  return Number(toTokens(netRaw, decimals));
}
