// Canonical home for the event schema Overview's ticker and the Activity
// audit trail both read - Activity is a richer projection of the same
// rows, not a parallel model. FeedEvent/EventKind moved here from
// overview.ts (which now imports FeedEvent back) since this is the domain
// that actually owns the concept; Overview is the lightweight consumer.

// ─── BASE (Overview's ticker reads exactly this) ───
export type EventKind =
  | "score"            // health score updated - informational, not a decision
  | "trigger"           // a decision was emitted (threshold crossed) - may or may not lead to an execution
  | "simulation"         // dry-run: what Vigil would have done, incl. aborted sims that prevented a bad execution
  | "execution"          // a rebalance that hit the chain - money actually moved
  | "approval"           // requested / granted / rejected, for Approve-mode actions
  | "alert"              // notify-only threshold crossed, no action taken
  | "circuit_breaker"    // safety interrupt tripped - always-on floor, independent of autonomy level
  | "cycle";             // polling cycle housekeeping

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

// Per-strategy honesty for partial exits - never collapse "3 of 5 exited,
// 2 reverted" into a single success/fail flag.
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

// The full audit-trail row. Extends FeedEvent's base fields verbatim so
// Activity can render the exact same rows Overview's feed does, just with
// everything below populated when the row warrants it (execution rows get
// stages/retries/proof links; a plain score update doesn't).
export interface ActivityEntry extends FeedEvent {
  reasoning?: string;    // why the trigger fired - the "agent thinks" part
  delta?: number;
  triggerId?: string;    // links an execution/approval back to the trigger that caused it
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
