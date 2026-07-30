// Cross-cutting primitives used across protocols/overview/strategies/vault.

export type Category = "rollup" | "lending" | "dex" | "lsd" | "cdp";
export type Band = "hold" | "reduce_25" | "reduce_50" | "exit";
export type Action = "reduce_25" | "reduce_50" | "exit";
export type Trend = "up" | "down" | "flat";
export type Severity = "info" | "low" | "medium" | "high" | "critical";
export type SignalStatus = "live" | "manual" | "derived" | "unavailable";
export type Confidence = "low" | "medium" | "high";
