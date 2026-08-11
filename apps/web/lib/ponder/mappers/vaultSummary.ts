import type { VaultsQuery } from "@/lib/ponder/generated/sdk";
import type { VaultSummary } from "@/types";
import { logoForTokenAddress } from "./tokenLogo";

type PonderVault = VaultsQuery["vaults"]["items"][number];

const STABLECOIN_SYMBOLS = new Set(["USDC", "USDT", "DAI", "USDE", "FRAX", "GHO"]);

// Static/unknown until vault-detail wiring: apy, tvl, score, and the other
// aggregate metrics need adapter allocations + price data that isn't in
// this query. NaN marks "unknown" so VaultsColumns can render "-" instead
// of a misleading 0.
export function toVaultSummary(vault: PonderVault): VaultSummary {
  return {
    slug: vault.id,
    name: vault.vaultName,
    asset: vault.assetSymbol,
    assetLogoURI: logoForTokenAddress(vault.asset),
    totalAssets: NaN,
    totalShares: NaN,
    sharePrice: NaN,
    idle: NaN,
    tvl: NaN,
    benchmarkDeltaPct: NaN,
    chain: "Base Sepolia",
    description: "-",
    assetType: STABLECOIN_SYMBOLS.has(vault.assetSymbol.toUpperCase())
      ? "stablecoin"
      : "volatile",
    vaultType: "-",
    vaultContractAddress: vault.id,
    tokenContractAddress: vault.asset,
    managementFeePct: 0,
    performanceFeePct: 0.1,
    deployedOn: new Date(Number(vault.createdAtTimestamp) * 1000).toISOString(),
    features: [],
    docs: { userDocsUrl: "", devDocsUrl: "", analyticsUrl: "", apiUrl: "" },
    apy: NaN,
    score: NaN,
    riskFlagged: 0,
    positionValueUsd: null,
    positionPnlUsd: null,
  };
}
