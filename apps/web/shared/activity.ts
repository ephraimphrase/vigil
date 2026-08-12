// ─────────────────────────────────────────────────────────────
// Activity domain — PURE. Kind/stage color maps (the thin left-rule per
// DESIGN.md's status conventions), CSV/JSON export, date-range presets.
// KIND_COLOR used to be a private const duplicated inside EventFeed.tsx;
// it's the single source now so Overview's ticker and the Activity
// timeline can't disagree on what color a "trigger" row is.
// ─────────────────────────────────────────────────────────────

import type { ActivityEntry, EventKind, StageStatus } from "@/types";

// ─── COLOR MAPS ───
// Composed entirely from DESIGN.md's sanctioned status palette (green/
// lime/amber/red + violet/violet-bright/neutral) - no new hexes invented.
// circuit_breaker shares alert's red; it reads as more severe through
// weight/icon in the row, not a second red.
export const KIND_COLOR: Record<EventKind, string> = {
  score: "#9F95AB",
  cycle: "#5FD08A",
  trigger: "#E0A95F",
  simulation: "#B7DE5F",
  execution: "#9259DA",
  approval: "#E5DBF1",
  alert: "#E0607F",
  circuit_breaker: "#E0607F",
  strategy_added: "#E5DBF1",
  strategy_removed: "#E0A95F",
  harvest: "#5FD08A",
};

export const KIND_LABEL: Record<EventKind, string> = {
  score: "Score",
  cycle: "Cycle",
  trigger: "Trigger",
  simulation: "Simulation",
  execution: "Execution",
  approval: "Approval",
  alert: "Alert",
  circuit_breaker: "Circuit breaker",
  strategy_added: "Strategy added",
  strategy_removed: "Strategy removed",
  harvest: "Harvest",
};

// Derived from KIND_COLOR's keys, not hand-typed again, so a new kind
// only ever needs adding in one place.
export const ALL_KINDS = Object.keys(KIND_COLOR) as EventKind[];

export const STAGE_COLOR: Record<StageStatus, string> = {
  pending: "#9F95AB",
  ok: "#5FD08A",
  failed: "#E0607F",
  skipped: "#9F95AB",
  aborted: "#B7DE5F", // caught before it became a failure - protective, not bad
};

// ─── DATE PRESETS ───
export type DateRangePreset = "24h" | "7d" | "30d" | "all";

const PRESET_HOURS: Record<Exclude<DateRangePreset, "all">, number> = {
  "24h": 24,
  "7d": 24 * 7,
  "30d": 24 * 30,
};

export const DATE_PRESETS: { id: DateRangePreset; label: string }[] = [
  { id: "24h", label: "24h" },
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "all", label: "All" },
];

export function withinPreset(ts: string, preset: DateRangePreset, now: Date = new Date()): boolean {
  if (preset === "all") return true;
  const hours = PRESET_HOURS[preset];
  return now.getTime() - new Date(ts).getTime() <= hours * 3_600_000;
}

// ─── EXPORT ───
const CSV_COLUMNS: (keyof ActivityEntry)[] = [
  "id", "ts", "kind", "protocolId", "message", "score", "action", "txHash",
  "reasoning", "delta", "gasCostUsd", "mevProtected", "keeperHubRef",
  "etherscanUrl", "x402ScanUrl", "approvalStatus", "circuitBreakerReason",
];

function csvCell(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(entries: ActivityEntry[]): string {
  const header = CSV_COLUMNS.join(",");
  const rows = entries.map((e) => CSV_COLUMNS.map((c) => csvCell(e[c])).join(","));
  return [header, ...rows].join("\n");
}

export function toJson(entries: ActivityEntry[]): string {
  return JSON.stringify(entries, null, 2);
}

export function downloadBlob(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
