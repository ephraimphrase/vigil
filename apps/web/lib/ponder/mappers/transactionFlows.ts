import type { DepositsQuery, WithdrawalsQuery } from "@/lib/ponder/generated/sdk";
import type { PriceByAddress } from "@/lib/tokenPrices";
import type { TransactionEntry } from "@/types";
import { vaultMeta, toAmount, amountUsd, type PonderVault } from "./vaultMeta";

const CHAIN_LABEL = "Base Sepolia";

type PonderDeposit = DepositsQuery["deposits"]["items"][number];
type PonderWithdrawal = WithdrawalsQuery["withdrawals"]["items"][number];

export function toDepositTransaction(
  d: PonderDeposit,
  vaultsById: Map<string, PonderVault>,
  prices: PriceByAddress,
): TransactionEntry {
  const { vaultSlug, vaultName, asset, decimals, assetAddress } = vaultMeta(vaultsById, d.vault);
  const amount = toAmount(d.assets, decimals);
  return {
    id: `deposit-${d.id}`,
    ts: new Date(Number(d.timestamp) * 1000).toISOString(),
    type: "deposit",
    chain: CHAIN_LABEL,
    vaultSlug,
    vaultName,
    asset,
    amount,
    amountUsd: amountUsd(amount, assetAddress, prices),
    shares: toAmount(d.shares, decimals),
    txHash: d.txHash,
    sender: d.sender.toLowerCase(),
  };
}

export function toWithdrawTransaction(
  w: PonderWithdrawal,
  vaultsById: Map<string, PonderVault>,
  prices: PriceByAddress,
): TransactionEntry {
  const { vaultSlug, vaultName, asset, decimals, assetAddress } = vaultMeta(vaultsById, w.vault);
  const amount = toAmount(w.assets, decimals);
  return {
    id: `withdraw-${w.id}`,
    ts: new Date(Number(w.timestamp) * 1000).toISOString(),
    type: "withdraw",
    chain: CHAIN_LABEL,
    vaultSlug,
    vaultName,
    asset,
    amount,
    amountUsd: amountUsd(amount, assetAddress, prices),
    shares: toAmount(w.shares, decimals),
    txHash: w.txHash,
    sender: w.sender.toLowerCase(),
  };
}
