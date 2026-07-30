import type { Category } from "./shared";

// paused/retired/lastHarvest/harvestable/maxWithdraw/maxDeposit mirror
// IVigilProtocolAdapter (apps/contracts/src/interface/IVigilProtocolAdapter.sol)
// and strategyAddress/want come from the BeefyStrategyAdapter it wraps -
// shaped to match what a live adapter read actually returns. No separate
// `status` field - paused/retired already fully represent lifecycle state,
// and a third redundant field just risks drifting out of sync with them.
export interface Strategy {
  protocolId: string;
  name: string;
  category: Category;
  description: string;       // what the strategy actually does with the deposited asset
  adapter: string;           // this adapter's own address (IVigilProtocolAdapter.vault() trusts it)
  strategyAddress: string;   // IVigilProtocolAdapter.strategy() - the wrapped Beefy strategy
  stratName: string;          // the wrapped contract's own stratName(), e.g. "Aave", "ERC4626", "SkyLockstakeV2"
  native: string;              // the wrapped strategy's `native` - swap intermediary every reward token routes through
  rewards: string[];           // reward token symbols the strategy actually claims and compounds
  harvestOnDeposit: boolean;   // if true, harvest() runs inline on every deposit instead of on a keeper cadence
  asset: string;
  want: string;               // the wrapped strategy's own `want` token; usually == asset, differs for LP strategies
  allocated: number;
  targetWeight: number;
  actualWeight: number;
  score: number;
  apy: number;
  lastRebalance: string;
  paused: boolean;
  retired: boolean;
  lastHarvest: string;         // ISO timestamp
  harvestable: boolean;
  maxWithdraw: number;         // USD
  maxDeposit: number | null;   // USD; null = unbounded (type(uint256).max)
  // Both hardcoded to 0 on BaseAllToNativeFactoryStrat (the base every
  // Common/-family strategy this adapter wraps extends) - depositFee()/
  // withdrawFee() are never actually configurable there.
  depositFee: number;          // fraction, e.g. 0.001 = 0.1%
  withdrawFee: number;         // fraction
}

// No vault field here - all strategies belong to the one VigilVault, so
// vault-level totals (asset/totalAssets/idle) come from useVault() /
// /api/vault, not a second copy duplicated into every strategies read.
export interface StrategiesData {
  strategies: Strategy[];
}
