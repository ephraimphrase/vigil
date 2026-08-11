import type { VaultQuery } from "@/lib/ponder/generated/sdk";
import type { VaultData } from "@/types";

type PonderVault = NonNullable<VaultQuery["vault"]>;

const STABLECOIN_SYMBOLS = new Set(["USDC", "USDT", "DAI", "USDE", "FRAX", "GHO"]);

// Position, allocation, risk checks, and history all need data this query
// doesn't have (wallet-specific deposits, protocol/health-oracle
// correlation, a time series) - left empty/null until that's wired up.
export function toVaultData(vault: PonderVault): VaultData {
  return {
    info: {
      slug: vault.id,
      name: vault.vaultName,
      asset: vault.assetSymbol,
      totalAssets: NaN,
      totalShares: NaN,
      // Static 1:1 default (an ERC-4626 vault starts here) rather than
      // unknown - previewDeposit/previewRedeem and VaultMoreInfo divide and
      // format this unconditionally.
      sharePrice: 1,
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
    },
    policy: {
      name: "-",
      maxWeightPerProtocol: 0,
      exitFloorScore: 0,
      cooldownHours: 0,
      autonomyDefault: "watch",
      excludedProtocols: [],
    },
    position: null,
    allocation: [],
    riskChecks: [],
    history: [],
  };
}
