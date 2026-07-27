// ─────────────────────────────────────────────────────────────
// MarketStrip — token stat readout (brief §4e): mono numerals divided by
// hairlines. Plain hairline frame, not a corner-node one — the masthead
// holds the page's single corner-node budget. Null for tokenless chains
// (the page guards before rendering this).
// ─────────────────────────────────────────────────────────────

import { deltaColor } from "@/lib/health";
import { fmtUsd, fmtUsdFull, fmtSigned } from "@/lib/format";
import type { Market } from "../types";

// ─── UTILS ───
function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-3">
      <span className="font-mono text-sm tabular-nums text-body" style={color ? { color } : undefined}>{value}</span>
      <span className="font-mono text-xs uppercase tracking-wider text-muted/60">{label}</span>
    </div>
  );
}

// ─── MAIN ───
export function MarketStrip({ market }: { market: Market }) {
  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-hairline rounded-none border border-hairline bg-panel/20 sm:grid-cols-3 lg:grid-cols-5 lg:divide-y-0">
      <Stat label="Price" value={market.tokenNote ? market.tokenNote : fmtUsdFull(market.price)} />
      <Stat label="Market cap" value={fmtUsd(market.marketCap)} />
      <Stat label="FDV" value={fmtUsd(market.fdv)} />
      <Stat label="24h" value={fmtSigned(market.priceChange24h, "%")} color={deltaColor(market.priceChange24h)} />
      <Stat label="7d" value={fmtSigned(market.priceChange7d, "%")} color={deltaColor(market.priceChange7d)} />
    </div>
  );
}