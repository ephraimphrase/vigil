import { toTokens } from "thirdweb";
import type { DepositsQuery, WithdrawalsQuery } from "@/lib/ponder/generated/sdk";

type PonderDeposit = DepositsQuery["deposits"]["items"][number];
type PonderWithdrawal = WithdrawalsQuery["withdrawals"]["items"][number];

// TVL estimate: net of all deposits minus withdrawals (in the vault's
// underlying-asset units), priced at the asset's current USD price. This
// is a lower bound, not VigilVault's real on-chain totalAssets() (idle
// balance + each adapter's totalAssets()) - it doesn't include yield
// adapters have accrued since their last harvest, since neither idle
// balance nor live adapter yield is indexed by Ponder. Net flow is the
// closest estimate available from indexed events alone.
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
