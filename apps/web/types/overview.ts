import type { SystemState } from "@/components/Layouts/StatusPill";
import type { Category } from "./shared";

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

export type EventKind = "score" | "trigger" | "execution" | "alert" | "cycle";

export interface FeedEvent {
  id: string;
  ts: string;
  kind: EventKind;
  protocolId?: string;
  message: string;
  score?: number;
  action?: string;
  txHash?: string;
}

export interface OverviewData {
  status: { state: SystemState; watchedCount: number; lastCycle: string };
  portfolio: Portfolio;
  positions: Position[];
  events: FeedEvent[];
  pendingApprovals: number;
}
