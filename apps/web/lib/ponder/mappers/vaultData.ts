import type { AdaptersQuery, DepositsQuery, VaultQuery, WithdrawalsQuery } from "@/lib/ponder/generated/sdk";
import { VaultKind } from "@/lib/ponder/generated/types";
import type { VaultData } from "@/types";
import { logoForTokenAddress } from "./tokenLogo";
import { weightedApy } from "./adapterApy";
import { estimateTvlUsd } from "./vaultTvl";
import { toVaultStrategies } from "./vaultStrategies";

type PonderVault = NonNullable<VaultQuery["vault"]>;
type PonderAdapter = AdaptersQuery["adapters"]["items"][number];
type PonderDeposit = DepositsQuery["deposits"]["items"][number];
type PonderWithdrawal = WithdrawalsQuery["withdrawals"]["items"][number];

const STABLECOIN_SYMBOLS = new Set(["USDC", "USDT", "DAI", "USDE", "FRAX", "GHO"]);

export function toVaultData(
  vault: PonderVault,
  adapters: PonderAdapter[],
  deposits: PonderDeposit[],
  withdrawals: PonderWithdrawal[],
  priceUsd: number | null,
  costBasisUsd: number | null,
): VaultData {
  return {
    info: {
      slug: vault.id,
      name: vault.vaultName,
      asset: vault.assetSymbol,
      assetLogoURI: logoForTokenAddress(vault.asset),
      totalAssets: NaN,
      totalShares: NaN,
      sharePrice: 1,
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
      performanceFeePct: NaN,
      deployedOn: new Date(Number(vault.createdAtTimestamp) * 1000).toISOString(),
      features: [],
      docs: { userDocsUrl: "", devDocsUrl: "", analyticsUrl: "", apiUrl: "" },
    },
    policy: {
      name: "-",
      maxWeightPerProtocol: 0,
      exitFloorScore: 0,
      cooldownHours: 0,
      autonomyDefault: "watch",
      excludedProtocols: [],
    },
    costBasisUsd,
    allocation: [],
    strategies: toVaultStrategies(adapters, vault.assetDecimals, priceUsd),
    riskChecks: [],
    history: [],
  };
}
