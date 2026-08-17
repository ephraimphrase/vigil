import { toTokens } from "thirdweb";

interface FlowEvent {
  assets: string;
}

export function netCostBasisAssets(deposits: FlowEvent[], withdrawals: FlowEvent[], decimals: number): number {
  const depositedRaw = deposits.reduce((sum, d) => sum + BigInt(d.assets), 0n);
  const withdrawnRaw = withdrawals.reduce((sum, w) => sum + BigInt(w.assets), 0n);
  const netRaw = depositedRaw > withdrawnRaw ? depositedRaw - withdrawnRaw : 0n;
  return Number(toTokens(netRaw, decimals));
}
