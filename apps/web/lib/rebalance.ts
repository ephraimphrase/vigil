// ─────────────────────────────────────────────────────────────
// Rebalance logic — PURE, no React. The card renders these; it does not
// decide what a rebalance is. Two independent drivers:
//   1. health   — band maps to a de-risk action (decision table)
//   2. drift     — actual vs target weight beyond a threshold
// rebalanceState combines them into what the engine will do next.
// ─────────────────────────────────────────────────────────────

import { resolveBand, BAND_META, type Band } from "@/lib/health";
import type { Strategy } from "../types";

// ─── CONSTANTS ───
export const DRIFT_THRESHOLD = 0.05; // 5 percentage points

// health band → intended position action
const BAND_ACTION: Record<Band, string> = {
  hold: "Hold",
  reduce_25: "Reduce 25%",
  reduce_50: "Reduce 50%",
  exit: "Full exit",
};

// ─── TYPES ───
export type RebalanceKind = "balanced" | "drift" | "derisk";

export interface RebalanceState {
  kind: RebalanceKind;
  label: string;     // human summary of the next action
  color: string;     // thin indicator color
  drift: number;     // actualWeight - targetWeight (signed)
  action: string;    // health-driven action from the band
}

// ─── UTILS ───
export const driftOf = (s: Strategy): number => s.actualWeight - s.targetWeight;

export const impliedAction = (score: number): string => BAND_ACTION[resolveBand(score)];

/**
 * Health de-risk takes precedence over drift: if a protocol is unhealthy the
 * engine trims it regardless of weight. Only when healthy does drift decide.
 */
export function rebalanceState(s: Strategy): RebalanceState {
  const band = resolveBand(s.score);
  const drift = driftOf(s);
  const action = BAND_ACTION[band];

  if (band !== "hold") {
    return { kind: "derisk", label: `${action} — health`, color: BAND_META[band].color, drift, action };
  }
  if (Math.abs(drift) > DRIFT_THRESHOLD) {
    const dir = drift > 0 ? "Trim to target" : "Add to target";
    return { kind: "drift", label: `${dir} — drift`, color: "#B7DE5F", drift, action };
  }
  return { kind: "balanced", label: "Balanced", color: "#5FD08A", drift, action };
}

// ─── AGGREGATES ───
export interface StrategyAggregate {
  deployed: number;
  weightedHealth: number;
  weightedApy: number;
  needsAttention: number; // count of non-balanced strategies
}

export function aggregate(strategies: Strategy[]): StrategyAggregate {
  const deployed = strategies.reduce((s, x) => s + x.allocated, 0);
  const w = (pick: (s: Strategy) => number) =>
    deployed === 0 ? 0 : strategies.reduce((s, x) => s + pick(x) * x.allocated, 0) / deployed;
  return {
    deployed,
    weightedHealth: Math.round(w((s) => s.score)),
    weightedApy: w((s) => s.apy),
    needsAttention: strategies.filter((s) => rebalanceState(s).kind !== "balanced").length,
  };
}
