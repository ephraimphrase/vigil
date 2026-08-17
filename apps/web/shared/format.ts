import numbro from "numbro";

const usdFull = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", maximumFractionDigits: 2,
});

export const fmtUsd = (v: number) => numbro(v).formatCurrency({ average: true, mantissa: 2 });
export const fmtUsdFull = (v: number) => usdFull.format(v);
export const fmtScore = (v: number) => String(Math.round(v));

export const fmtSigned = (v: number, suffix = "") => {
  const sign = v > 0 ? "+" : v < 0 ? "\u2212" : "";
  return `${sign}${Math.abs(v).toFixed(1)}${suffix}`;
};

export const fmtPct = (v: number) => `${(v * 100).toFixed(0)}%`;

export const fmtFeePct = (v: number) => {
  if (!Number.isFinite(v)) return "-";
  const pct = v * 100;
  return `${Number.isInteger(pct) ? pct.toFixed(0) : pct.toFixed(2)}%`;
};

export const fmtAddress = (a: string, lead = 6, trail = 4) =>
  a.length <= lead + trail ? a : `${a.slice(0, lead)}...${a.slice(-trail)}`;

export const dateShort = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export const fmtDateLong = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

export const trendArrow = (t: "up" | "down" | "flat") =>
  t === "up" ? "\u2191" : t === "down" ? "\u2193" : "\u2192";
