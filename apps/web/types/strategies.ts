import type { Category } from "./shared";

export type StrategyStatus = "active" | "paused" | "exiting";

// paused/retired/lastHarvest/harvestable/maxWithdraw/maxDeposit mirror
// IVigilProtocolAdapter (apps/contracts/src/interface/IVigilProtocolAdapter.sol)
// and strategyAddress/want come from the BeefyStrategyAdapter it wraps -
// shaped to match what a live adapter read actually returns.
export interface Strategy {
  protocolId: string;
  name: string;
  category: Category;
  description: string;       // what the strategy actually does with the deposited asset
  adapter: string;           // this adapter's own address (IVigilProtocolAdapter.vault() trusts it)
  strategyAddress: string;   // IVigilProtocolAdapter.strategy() - the wrapped Beefy strategy
  asset: string;
  want: string;               // the wrapped strategy's own `want` token; usually == asset, differs for LP strategies
  allocated: number;
  targetWeight: number;
  actualWeight: number;
  score: number;
  apy: number;
  lastRebalance: string;
  status: StrategyStatus;
  paused: boolean;
  retired: boolean;
  lastHarvest: string;         // ISO timestamp
  harvestable: boolean;
  maxWithdraw: number;         // USD
  maxDeposit: number | null;   // USD; null = unbounded (type(uint256).max)
  depositFee: number;          // fraction, e.g. 0.001 = 0.1% - StratFeeManagerInitializable.depositFee()
  withdrawFee: number;         // fraction - StratFeeManagerInitializable.withdrawFee()
}

export interface VaultBuffer {
  asset: string;
  totalAssets: number;
  idle: number;
}

export interface StrategiesData {
  vault: VaultBuffer;
  strategies: Strategy[];
}
