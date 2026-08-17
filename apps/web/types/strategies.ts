import type { Category } from "./shared";

export interface Strategy {
  id: string;
  protocolId: string;
  protocolName: string;
  icon: string;
  name: string;
  category: Category;
  description: string;
  adapter: string;
  strategyAddress: string;
  stratName: string;
  native: string;
  rewards: string[];
  harvestOnDeposit: boolean;
  asset: string;
  want: string;
  allocated: number;
  targetWeight: number;
  actualWeight: number;
  score: number;
  apy: number;
  lastRebalance: string;
  paused: boolean;
  retired: boolean;
  lastHarvest: string; // ISO timestamp
  harvestable: boolean;
  maxWithdraw: number; // USD
  maxDeposit: number | null; // USD; null = unbounded
  depositFee: number; // fraction, e.g. 0.001 = 0.1%
  withdrawFee: number; // fraction
  subRows?: Strategy[];
}

export interface StrategiesData {
  strategies: Strategy[];
}
