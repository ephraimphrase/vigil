import type { Category } from "./shared";

export type AutonomyLevel = "watch" | "alert" | "approve" | "auto";

export interface VaultPolicy {
  name: string;
  maxWeightPerProtocol: number;
  exitFloorScore: number;
  cooldownHours: number;
  autonomyDefault: AutonomyLevel;
  excludedProtocols: string[];
}

export interface VaultInfo {
  slug: string;
  name: string;
  /** The vault's single deposit/accounting asset (ERC-4626 style - one token in, shares out). */
  asset: string;
  /**
   * For LP/pool-token vaults, the constituent tokens `asset` is actually a
   * claim on (e.g. `asset: "stETH-ETH LP"`, `underlyingAssets: ["stETH", "ETH"]`).
   * Absent for ordinary single-token vaults, where `asset` alone is the whole story.
   */
  underlyingAssets?: string[];
  /** Icon override for `asset` - TokenIcon's hardcoded symbol map only covers a handful of well-known tokens. */
  assetLogoURI?: string;
  totalAssets: number;
  totalShares: number;
  sharePrice: number;
  idle: number;
  tvl: number;
  /** Allocation-weighted across the vault's adapters (lib/ponder/mappers/adapterApy.ts) - 0 with no live adapters. */
  apy: number;
  benchmarkDeltaPct: number;
  chain: string;
  description: string;
  assetType: "stablecoin" | "volatile";
  vaultType: string;
  vaultContractAddress: string;
  tokenContractAddress: string;
  performanceFeePct: number;
  deployedOn: string;         // ISO date
  features: string[];
  docs: {
    userDocsUrl: string;
    devDocsUrl: string;
    analyticsUrl: string;
    apiUrl: string;
  };
}

export interface VaultHistoryPoint {
  ts: string;             // ISO date
  apy30d: number;
  performance: number;    // cumulative % return since inception
  tvl: number;
}

// Built client-side (components/Vault/VaultDetailView.tsx) from a live
// maxWithdraw read (useVaultWithdrawable, also feeds the masthead's "Your
// deposit" so the two numbers can't drift) plus VaultData.costBasisUsd,
// the one piece that needs indexed deposit/withdrawal history rather than
// a live read. Every field is nullable rather than defaulting to 0 -
// "unknown" (price feed down, read still resolving) and "genuinely zero"
// are different states this section shouldn't blur together.
export interface UserPosition {
  shares: number | null;
  valueUsd: number | null;
  costBasisUsd: number | null;
  pnlUsd: number | null;
  walletUsdc: number | null;
}

export interface AllocationRow {
  protocolId: string;
  name: string;
  category: Category;
  targetWeight: number;
  actualWeight: number;
  valueUsd: number;
  score: number;
  apy: number;
}

// One of the vault's IVigilProtocolAdapter strategies (Ponder's `adapter`
// entity) - real, unlike AllocationRow above (still needs a protocol
// registry for category + the full oracle-weighted target calc for
// targetWeight, neither wired up yet).
export interface VaultStrategyRow {
  id: string;
  protocolId: string;
  stratName: string;
  apy: number;
  allocated: number;
  allocatedUsd: number | null;
  paused: boolean;
  retired: boolean;
  lastHarvestAt: string | null; // ISO date, null if never harvested
  lastHarvestGainUsd: number | null;
}

// Beefy-checklist-style pass/fail row - vault-level (the strategy set as a
// whole), not per-protocol. Distinct from protocols' severity-graded RiskRow
// (see types/protocols.ts) - a different question (did this pass a fixed
// gate? vs. how severe is this open issue?).
export interface RiskCheckRow {
  id: string;
  label: string;
  passed: boolean;
  note?: string;
}

export interface VaultData {
  info: VaultInfo;
  policy: VaultPolicy;
  /**
   * This vault's requester net deposits minus withdrawals, in USD - null
   * with no `?address=` on the request (no wallet to compute it for) or no
   * verified price for this asset. The live half of a position (current
   * value, share count) comes from an on-chain read instead - see
   * UserPosition, built client-side from this plus that.
   */
  costBasisUsd: number | null;
  allocation: AllocationRow[];
  strategies: VaultStrategyRow[];
  riskChecks: RiskCheckRow[];
  history: VaultHistoryPoint[];
}

// Row shape for the /dashboard/vault picker. `apy` and `score` are both
// derived from the vault's own allocation (vaultAggregate, shared/vault.ts
// - score is its dollar-weighted health); `riskFlagged` from its own
// riskChecks; `positionValueUsd` from its own position - all computed once
// at seed-build time from that same vault's VaultData, never hand-entered
// a second time.
export interface VaultSummary extends VaultInfo {
  score: number;
  riskFlagged: number;
  positionValueUsd: number | null;
  positionPnlUsd: number | null;
}
