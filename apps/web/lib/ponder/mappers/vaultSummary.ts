import type { AdaptersQuery, DepositsQuery, VaultsQuery, WithdrawalsQuery } from "@/lib/ponder/generated/sdk";
import { VaultKind } from "@/lib/ponder/generated/types";
import type { VaultSummary } from "@/types";
import { logoForTokenAddress } from "./tokenLogo";
import { weightedApy } from "./adapterApy";
import { estimateTvlUsd } from "./vaultTvl";

type PonderVault = VaultsQuery["vaults"]["items"][number];
type PonderAdapter = AdaptersQuery["adapters"]["items"][number];
type PonderDeposit = DepositsQuery["deposits"]["items"][number];
type PonderWithdrawal = WithdrawalsQuery["withdrawals"]["items"][number];

const STABLECOIN_SYMBOLS = new Set(["USDC", "USDT", "DAI", "USDE", "FRAX", "GHO"]);

// Static/unknown until vault-detail wiring: score and the other aggregate
// metrics need protocol-allocation data that isn't in this query. NaN
// marks "unknown" so VaultsColumns can render "-" instead of a misleading
// 0. apy and tvl are the exceptions - real, from this vault's own slice of
// /api/vaults' Adapters/Deposits/Withdrawals({ limit }) calls plus its
// asset's live price (lib/tokenPrices.ts).
export function toVaultSummary(
  vault: PonderVault,
  adapters: PonderAdapter[],
  deposits: PonderDeposit[],
  withdrawals: PonderWithdrawal[],
  priceUsd: number | null,
): VaultSummary {
  return {
    slug: vault.id,
    name: vault.vaultName,
    asset: vault.assetSymbol,
    assetLogoURI: logoForTokenAddress(vault.asset),
    totalAssets: NaN,
    totalShares: NaN,
    sharePrice: NaN,
    idle: NaN,
    tvl: estimateTvlUsd(deposits, withdrawals, vault.assetDecimals, priceUsd),
    apy: weightedApy(adapters),
    benchmarkDeltaPct: NaN,
    chain: "Base Sepolia",
    description: "-",
    assetType: STABLECOIN_SYMBOLS.has(vault.assetSymbol.toUpperCase())
      ? "stablecoin"
      : "volatile",
    vaultType: vault.kind === VaultKind.Lp ? "LP" : "Single Asset",
    vaultContractAddress: vault.id,
    tokenContractAddress: vault.asset,
    managementFeePct: 0,
    performanceFeePct: 0.3,
    deployedOn: new Date(Number(vault.createdAtTimestamp) * 1000).toISOString(),
    features: [],
    docs: { userDocsUrl: "", devDocsUrl: "", analyticsUrl: "", apiUrl: "" },
    score: NaN,
    riskFlagged: 0,
    positionValueUsd: null,
    positionPnlUsd: null,
  };
}
