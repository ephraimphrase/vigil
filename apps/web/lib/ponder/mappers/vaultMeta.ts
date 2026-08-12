import { toTokens } from "thirdweb";
import type { VaultsQuery } from "@/lib/ponder/generated/sdk";
import type { PriceByAddress } from "@/lib/tokenPrices";

export type PonderVault = VaultsQuery["vaults"]["items"][number];

export interface VaultMeta {
  vaultSlug: string;
  vaultName: string;
  asset: string;
  decimals: number;
  assetAddress: string | undefined;
}

// Shared by every mapper that needs "which vault, which asset, how many
// decimals" from just a vault address - transactionFlows.ts and
// vaultActivity.ts both key off this instead of each re-deriving it.
export function buildVaultsById(vaults: PonderVault[]): Map<string, PonderVault> {
  return new Map(vaults.map((v) => [v.id.toLowerCase(), v]));
}

export function vaultMeta(vaultsById: Map<string, PonderVault>, vaultAddress: string): VaultMeta {
  const vault = vaultsById.get(vaultAddress.toLowerCase());
  return {
    vaultSlug: vaultAddress.toLowerCase(),
    vaultName: vault?.vaultName ?? vaultAddress,
    asset: vault?.assetSymbol ?? "?",
    decimals: vault?.assetDecimals ?? 18,
    assetAddress: vault?.asset,
  };
}

export const toAmount = (raw: string, decimals: number): number => Number(toTokens(BigInt(raw), decimals));

export function amountUsd(amount: number, assetAddress: string | undefined, prices: PriceByAddress): number | null {
  const price = assetAddress ? prices[assetAddress.toLowerCase()] : undefined;
  return price == null ? null : amount * price;
}
