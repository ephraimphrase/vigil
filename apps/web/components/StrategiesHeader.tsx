// ─────────────────────────────────────────────────────────────
// StrategiesHeader — aggregate stat readout across all strategies + the
// vault buffer. Plain hairline stat strip (the page's corner-node budget
// is spent elsewhere; here density beats decoration).
// ─────────────────────────────────────────────────────────────

import { ScoreBadge } from "@/components/health/ScoreBadge";
import { fmtUsd } from "@/lib/format";
import { aggregate } from "../lib/rebalance";
import { useVault } from "../hooks/useVault";
import type { StrategiesData } from "../types";

// ─── UTILS ───
function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3">
      <div className="flex items-center">{children}</div>
      <span className="font-mono text-xs uppercase tracking-wider text-muted/60">{label}</span>
    </div>
  );
}

// ─── MAIN ───
export function StrategiesHeader({ data }: { data: StrategiesData }) {
  const vault = useVault();
  const agg = aggregate(data.strategies);
  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-hairline rounded-none border border-hairline bg-panel/20 md:grid-cols-5 md:divide-y-0">
      <Stat label="Deployed"><span className="font-mono text-lg tabular-nums text-body">{fmtUsd(agg.deployed)}</span></Stat>
      <Stat label="Idle (USDC)"><span className="font-mono text-lg tabular-nums text-body">{fmtUsd(vault.info.idle)}</span></Stat>
      <Stat label="Strategies"><span className="font-mono text-lg tabular-nums text-body">{data.strategies.length}</span></Stat>
      <Stat label="Weighted health"><ScoreBadge score={agg.weightedHealth} /></Stat>
      <Stat label="Blended APY"><span className="font-mono text-lg tabular-nums text-body">{agg.weightedApy.toFixed(1)}%</span></Stat>
    </div>
  );
}
