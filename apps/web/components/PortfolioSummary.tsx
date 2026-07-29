

import { CornerFrame } from "@/components/ui/CornerFrame";
import { AllocationDonut } from "./AllocationDonut";
import { deltaColor } from "@/lib/health";
import { fmtUsdFull, fmtSigned } from "@/lib/format";
import type { Portfolio, Position } from "../types";

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-lg tabular-nums text-body" style={color ? { color } : undefined}>{value}</span>
      <span className="font-mono text-xs uppercase tracking-wider text-muted/60">{label}</span>
    </div>
  );
}

export function PortfolioSummary({ portfolio, positions }: { portfolio: Portfolio; positions: Position[] }) {
  const deployed = positions.reduce((s, p) => s + p.allocated, 0);
  return (
    <CornerFrame>
      <div className="flex flex-col gap-6 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-5">
          <div>
            <div className="font-display text-4xl leading-none tracking-tight text-body">
              {fmtUsdFull(portfolio.totalValue)}
            </div>
            <div className="mt-1 flex items-center gap-3 font-mono text-xs">
              <span className="text-muted/60">24h</span>
              <span style={{ color: deltaColor(portfolio.pnl24h) }}>
                {fmtSigned(portfolio.pnl24h)} ({fmtSigned(portfolio.pnlPct24h, "%")})
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <Stat label="Vault shares" value={portfolio.shares.toLocaleString("en-US", { maximumFractionDigits: 0 })} />
            <Stat label="Share price" value={`$${portfolio.sharePrice.toFixed(4)}`} />
            <Stat label="vs. no-op" value={fmtSigned(portfolio.benchmarkDeltaPct, "%")} color={deltaColor(portfolio.benchmarkDeltaPct)} />
          </div>
        </div>
        <AllocationDonut positions={positions} total={deployed} />
      </div>
    </CornerFrame>
  );
}
