// ─── BASE (Overview's ticker reads exactly this) ───
export type EventKind =
  | "score"
  | "trigger"
  | "simulation"
  | "execution"
  | "approval"
  | "alert"
  | "circuit_breaker"
  | "cycle"
  | "strategy_added"
  | "strategy_removed"
  | "harvest";

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

// ─── STAGED EXECUTION DETAIL (Activity-only) ───
export type StageStatus = "pending" | "ok" | "failed" | "skipped" | "aborted";

export interface ExecutionStage {
  label: string;   // "Trigger" | "Simulation" | "Submission" | "Confirmation" | ...
  status: StageStatus;
  detail: string;  // human summary of what happened at this stage
  ts?: string;
}

export interface StrategyExitResult {
  protocolId: string;
  name: string;
  status: "ok" | "reverted" | "skipped";
  txHash?: string;
  note?: string;
}

export interface RetryAttempt {
  attempt: number;
  ts: string;
  gasPriceGwei: number;
  status: "reverted" | "underpriced" | "ok";
  note?: string;
}

export type ApprovalStatus = "requested" | "granted" | "rejected";

export interface ActivityEntry extends FeedEvent {
  reasoning?: string;
  delta?: number;
  triggerId?: string;
  stages?: ExecutionStage[];
  retries?: RetryAttempt[];
  strategyResults?: StrategyExitResult[];
  gasCostUsd?: number;
  mevProtected?: boolean;
  keeperHubRef?: string;
  etherscanUrl?: string;
  x402ScanUrl?: string;
  approvalStatus?: ApprovalStatus;
  circuitBreakerReason?: string;
}

export interface ActivityData {
  entries: ActivityEntry[];
}
