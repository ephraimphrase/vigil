import type { SystemState } from "@/components/Layouts/StatusPill";
import type { Category } from "./shared";
import type { FeedEvent } from "./activity";

export interface Portfolio {
  totalValue: number;
  shares: number;
  sharePrice: number;
  pnl24h: number;
  pnlPct24h: number;
  benchmarkDeltaPct: number;
}

export interface Position {
  protocolId: string;
  name: string;
  category: Category;
  allocated: number;
  targetWeight: number;
  actualWeight: number;
  score: number;
  apy: number;
  lastRebalance: string;
}

export interface OverviewData {
  status: { state: SystemState; watchedCount: number; lastCycle: string };
  portfolio: Portfolio;
  positions: Position[];
  events: FeedEvent[];
  pendingApprovals: number;
}
