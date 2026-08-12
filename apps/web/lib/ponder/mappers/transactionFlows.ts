import { toTokens } from "thirdweb";
import type { DepositsQuery, VaultsQuery, WithdrawalsQuery } from "@/lib/ponder/generated/sdk";
import type { PriceByAddress } from "@/lib/tokenPrices";
import type { TransactionEntry } from "@/types";

const CHAIN_LABEL = "Base Sepolia";

type PonderVault = VaultsQuery["vaults"]["items"][number];
type PonderDeposit = DepositsQuery["deposits"]["items"][number];
type PonderWithdrawal = WithdrawalsQuery["withdrawals"]["items"][number];

function vaultMeta(vaultsById: Map<string, PonderVault>, vaultAddress: string) {
  const vault = vaultsById.get(vaultAddress.toLowerCase());
  return {
    vaultSlug: vaultAddress.toLowerCase(),
    vaultName: vault?.vaultName ?? vaultAddress,
    asset: vault?.assetSymbol ?? "?",
    decimals: vault?.assetDecimals ?? 18,
    assetAddress: vault?.asset,
  };
}

const toAmount = (raw: string, decimals: number) => Number(toTokens(BigInt(raw), decimals));

function amountUsd(amount: number, assetAddress: string | undefined, prices: PriceByAddress): number | null {
  const price = assetAddress ? prices[assetAddress.toLowerCase()] : undefined;
  return price == null ? null : amount * price;
}

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
  };
}
