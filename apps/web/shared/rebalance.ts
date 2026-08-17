import { resolveBand, BAND_META, type Band } from "@/shared/health";
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

// ─── GROUPING ───
/**
 * Folds a flat Strategy[] into one row per protocol for the strategies
 * table - every strategy sits under its protocol, always, even a protocol
 * with a single strategy contract (Aave, Lido, ...) still gets a protocol
 * row, so the table's top level is uniformly "protocols," and every
 * protocol row is expandable (subRows always attached) so its metrics -
 * which StrategyColumns.tsx only renders on strategy rows, never on the
 * protocol row itself - are always one click away. Every field on the
 * synthetic parent is a real aggregate of its children (dollar-weighted
 * for apy/fees, same weighting `aggregate()` above uses; summed for
 * weight/TVL/maxWithdraw; "any child" for paused/retired/harvestable -
 * worst-first, same philosophy as DEFAULT_SORT in useProtocolsTable) -
 * used for sort/filter even though the parent row doesn't display it.
 */
export function groupByProtocol(strategies: Strategy[]): Strategy[] {
  const byProtocol = new Map<string, Strategy[]>();
  for (const s of strategies) {
    const list = byProtocol.get(s.protocolId);
    if (list) list.push(s);
    else byProtocol.set(s.protocolId, [s]);
  }

  const result: Strategy[] = [];
  for (const children of byProtocol.values()) {
    const first = children[0];
    if (!first) continue; // Map.values() never yields an empty array, but satisfies noUncheckedIndexedAccess

    const allocated = children.reduce((s, c) => s + c.allocated, 0);
    const weighted = (pick: (c: Strategy) => number) =>
      allocated === 0 ? 0 : children.reduce((s, c) => s + pick(c) * c.allocated, 0) / allocated;
    const mostRecent = (pick: (c: Strategy) => string) =>
      children.reduce((max, c) => (pick(c) > max ? pick(c) : max), pick(first));
    result.push({
      id: `${first.protocolId}::group`,
      protocolId: first.protocolId,
      protocolName: first.protocolName,
      icon: first.icon,
      name: first.protocolName,
      category: first.category,
      description: `${children.length} ${children.length === 1 ? "strategy" : "strategies"}`,
      adapter: "",
      strategyAddress: "",
      stratName: "",
      native: "",
      rewards: [],
      harvestOnDeposit: false,
      asset: first.asset,
      want: "",
      allocated,
      targetWeight: children.reduce((s, c) => s + c.targetWeight, 0),
      actualWeight: children.reduce((s, c) => s + c.actualWeight, 0),
      score: first.score,
      apy: weighted((c) => c.apy),
      lastRebalance: mostRecent((c) => c.lastRebalance),
      paused: children.some((c) => c.paused),
      retired: children.some((c) => c.retired),
      lastHarvest: mostRecent((c) => c.lastHarvest),
      harvestable: children.some((c) => c.harvestable),
      maxWithdraw: children.reduce((s, c) => s + c.maxWithdraw, 0),
      maxDeposit: children.some((c) => c.maxDeposit == null)
        ? null
        : children.reduce((s, c) => s + (c.maxDeposit ?? 0), 0),
      depositFee: weighted((c) => c.depositFee),
      withdrawFee: weighted((c) => c.withdrawFee),
      subRows: children,
    });
  }
  return result;
}
