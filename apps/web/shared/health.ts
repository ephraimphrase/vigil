export type Band = "hold" | "reduce_25" | "reduce_50" | "exit";
export type Severity = "info" | "low" | "medium" | "high" | "critical";

// ─── CONSTANTS ───
export const BAND_META: Record<Band, { label: string; range: string; color: string }> = {
  hold:      { label: "HOLD",       range: "80–100", color: "#5FD08A" },
  reduce_25: { label: "REDUCE 25%", range: "60–79",  color: "#B7DE5F" },
  reduce_50: { label: "REDUCE 50%", range: "40–59",  color: "#E0A95F" },
  exit:      { label: "EXIT",       range: "0–39",   color: "#E0607F" },
};

const SEVERITY_COLOR: Record<Severity, string> = {
  info: "#9F95AB", low: "#5FD08A", medium: "#E0A95F", high: "#E0607F", critical: "#E0607F",
};

export const DELTA_COLOR = { up: "#5FD08A", down: "#E0607F" } as const;

// ─── UTILS ───
export const resolveBand = (score: number): Band =>
  score >= 80 ? "hold" : score >= 60 ? "reduce_25" : score >= 40 ? "reduce_50" : "exit";

export const bandColor = (score: number): string => BAND_META[resolveBand(score)].color;

export const severityColor = (s: Severity): string => SEVERITY_COLOR[s];

export const deltaColor = (v: number): string | undefined =>
  v > 0 ? DELTA_COLOR.up : v < 0 ? DELTA_COLOR.down : undefined;
