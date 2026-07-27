// ─────────────────────────────────────────────────────────────
// Protocols · pure formatters
// No domain knowledge, no React. Band/color logic lives in bands.config.
// ─────────────────────────────────────────────────────────────

const usdCompact = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  });
  
  export const fmtUsd = (v: number): string => usdCompact.format(v);
  
  export const fmtScore = (v: number): string => String(Math.round(v));
  
  /** Signed value with unicode minus and optional suffix, e.g. "+3.2%" / "−1.4". */
  export const fmtSigned = (v: number, suffix = ""): string => {
    const sign = v > 0 ? "+" : v < 0 ? "\u2212" : "";
    return `${sign}${Math.abs(v).toFixed(1)}${suffix}`;
  };