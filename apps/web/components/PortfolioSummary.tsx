

import { CornerFrame } from "@/components/ui/CornerFrame";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { AllocationDonut } from "./AllocationDonut";
import { deltaColor } from "@/lib/health";
import { fmtUsdFull, fmtSigned } from "@/lib/format";
import type { Portfolio, Position } from "../types";
import type { ReactNode } from "react";

function Stat({ label, value, color, info }: { label: string; value: string; color?: string; info?: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-lg tabular-nums text-body" style={color ? { color } : undefined}>{value}</span>
      <span className="flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-muted/60">
        {label}
        {info ? <InfoTooltip>{info}</InfoTooltip> : null}
      </span>
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
            <div className="flex items-center gap-1.5 font-display text-4xl leading-none tracking-tight text-body">
              {fmtUsdFull(portfolio.totalValue)}
              <InfoTooltip>
                Your entire position — shares × share price. Some may be deployed into
                strategies and some idle as the risk-off USDC buffer. If Vigil exits
                everything unsafe, this doesn&apos;t drop to zero — it moves to idle and waits.
              </InfoTooltip>
            </div>
            <div className="mt-1 flex items-center gap-3 font-mono text-xs">
              <span className="text-muted/60">24h</span>
              <span style={{ color: deltaColor(portfolio.pnl24h) }}>
                {fmtSigned(portfolio.pnl24h)} ({fmtSigned(portfolio.pnlPct24h, "%")})
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <Stat
              label="Vault shares"
              value={portfolio.shares.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              info="Your ownership unit in the vault. Depositing USDC mints you shares — a claim on a slice of the whole pool, not any single position."
            />
            <Stat
              label="Share price"
              value={`$${portfolio.sharePrice.toFixed(4)}`}
              info="Total pool value ÷ total shares. Starts near $1.00 and rises as strategies earn yield — you hold the same shares, each worth more over time."
            />
            <Stat
              label="vs. no-op"
              value={fmtSigned(portfolio.benchmarkDeltaPct, "%")}
              color={deltaColor(portfolio.benchmarkDeltaPct)}
              info="How the vault performed versus doing nothing — holding USDC with no monitoring or rebalancing. This is what Vigil's active management actually added."
            />
          </div>
        </div>
        <AllocationDonut positions={positions} total={deployed} />
      </div>
    </CornerFrame>
  );
}
