import { toTokens } from "thirdweb";
import type { DepositsQuery, WithdrawalsQuery } from "@/lib/ponder/generated/sdk";

type PonderDeposit = DepositsQuery["deposits"]["items"][number];
type PonderWithdrawal = WithdrawalsQuery["withdrawals"]["items"][number];

export function estimateTvlUsd(
  deposits: PonderDeposit[],
  withdrawals: PonderWithdrawal[],
  decimals: number,
  priceUsd: number | null,
): number {
  if (priceUsd == null) return NaN;

  const depositedRaw = deposits.reduce((sum, d) => sum + BigInt(d.assets), 0n);
  const withdrawnRaw = withdrawals.reduce((sum, w) => sum + BigInt(w.assets), 0n);
  const netRaw = depositedRaw > withdrawnRaw ? depositedRaw - withdrawnRaw : 0n;

  return Number(toTokens(netRaw, decimals)) * priceUsd;
}
