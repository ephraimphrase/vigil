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

// Allocation, risk checks, and history all need data this query doesn't
// have (protocol/health-oracle correlation, a time series) - left
// empty/null until that's wired up. `adapters`/`deposits`/`withdrawals`
// are this vault's own rows (separate queries, all filtered by
// `where: { vault: id }`) and `priceUsd` this vault's asset's live
// CoinGecko price (lib/tokenPrices.ts) - apy and tvl are the two info
// fields that aren't derivable from the vault row alone. `costBasisUsd`
// is the route's problem (it needs a request-specific address to filter
// deposits/withdrawals by owner, which this pure mapper doesn't have),
// passed straight through.
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
      // Static 1:1 default (an ERC-4626 vault starts here) rather than
      // unknown - previewDeposit/previewRedeem and VaultMoreInfo divide and
      // format this unconditionally.
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
      // No performance-fee getter exists on the vault contract yet - NaN
      // marks "unknown" (fmtFeePct renders "-") rather than a fabricated %.
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
