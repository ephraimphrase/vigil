// ─────────────────────────────────────────────────────────────
// Protocols · score bands + status colors
// The ONLY place status color is allowed (design brief §2). Colors here
// render as 2px rules / range labels / signed deltas — never as fills.
// ─────────────────────────────────────────────────────────────

// ─── TYPES ───
export interface Band {
  min: number;    // inclusive lower bound
  label: string;  // mono uppercase range label
  action: string; // decision-engine action
  color: string;  // thin indicator only
}

// ─── CONSTANTS ───
const LOWEST_BAND: Band = { min: 0, label: "EXIT", action: "exit", color: "#E0607F" };

export const BANDS: Band[] = [
  { min: 80, label: "HOLD",       action: "hold",      color: "#5FD08A" },
  { min: 60, label: "REDUCE 25%", action: "reduce_25", color: "#B7DE5F" },
  { min: 40, label: "REDUCE 50%", action: "reduce_50", color: "#E0A95F" },
  LOWEST_BAND,
];

export const DELTA_COLOR = {
  up: "#5FD08A",
  down: "#E0607F",
} as const;

// ─── UTILS ───
export const resolveBand = (score: number): Band =>
  BANDS.find((b) => score >= b.min) ?? LOWEST_BAND;

export const deltaColor = (v: number): string | undefined =>
  v > 0 ? DELTA_COLOR.up : v < 0 ? DELTA_COLOR.down : undefined;