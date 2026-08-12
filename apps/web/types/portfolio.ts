// The connected wallet's real cross-vault position, served by
// /api/portfolio/[address] (lib/ponder/mappers/portfolio.ts). Distinct
// from OverviewData's `Portfolio`/`Position` (still seed-mocked) - this is
// the real replacement for PortfolioSummary specifically; MyProtocols/
// YourPositions haven't been wired to real data yet.

export interface PortfolioVaultPosition {
  vaultSlug: string;
  vaultName: string;
  asset: string;
  assetLogoURI?: string;
  currentAssets: number;
  /** null when this asset has no verified CoinGecko price yet (lib/tokenPriceIds.ts). */
  currentUsd: number | null;
  costBasisUsd: number | null;
  pnlUsd: number | null;
  /** Real, allocation-weighted across this vault's adapters (lib/ponder/mappers/adapterApy.ts). */
  apy: number;
  /** Real, allocation-weighted across this vault's adapters' protocol scores (lib/ponder/mappers/protocolHealth.ts). "Most recently reported," not a replica of the on-chain staleness check. */
  health: number;
}

export interface PortfolioSummaryData {
  totalValueUsd: number;
  pnlUsd: number;
  /** Vaults with a currently nonzero position, not just ever-touched. */
  vaultsCount: number;
  /** Position-weighted across held vaults' own real APYs. */
  currentApy: number;
  /** Not derivable - Ponder doesn't index a share-price time series and adapter yield rates are immutable on-chain. Always null; the UI renders "-". */
  apy30d: number | null;
  positions: PortfolioVaultPosition[];
}
