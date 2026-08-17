"use client";

import type { ReactNode } from "react";
import { CornerFrame } from "@/components/ui/CornerFrame";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { AllocationDonut } from "./AllocationDonut";
import { usePortfolio } from "@/hooks/usePortfolio";
import { deltaColor } from "@/shared/health";
import { fmtUsdFull, fmtSigned } from "@/shared/format";

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

export function PortfolioSummary() {
  const { data, isLoading, connected } = usePortfolio();
  const { totalValueUsd, pnlUsd, vaultsCount, currentApy, positions } = data;

  const costBasisUsd = totalValueUsd - pnlUsd;
  const pnlPct = costBasisUsd !== 0 ? (pnlUsd / costBasisUsd) * 100 : 0;
  const allocations = positions.map((p) => ({ name: p.vaultName, valueUsd: p.currentUsd ?? 0 }));

  const show = connected && !isLoading;

  return (
    <CornerFrame>
      <div className="flex flex-col gap-6 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-5">
          <div>
            <div className="flex items-center gap-1.5 font-display text-4xl leading-none tracking-tight text-body">
              {!connected ? "—" : isLoading ? "…" : fmtUsdFull(totalValueUsd)}
              <InfoTooltip>
                Your entire position across every vault you&apos;ve deposited into — net deposits plus or minus
                each vault&apos;s own yield or loss, valued at today&apos;s price. If a vault holds it idle rather
                than deployed, this doesn&apos;t drop — it&apos;s still yours, just not earning yet.
              </InfoTooltip>
            </div>
            {show && (
              <div className="mt-1 flex items-center gap-3 font-mono text-xs">
                <span className="text-muted/60">P&amp;L</span>
                <span style={{ color: deltaColor(pnlUsd) }}>
                  {fmtSigned(pnlUsd)} ({fmtSigned(pnlPct, "%")})
                </span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-6">
            <Stat
              label="Vaults"
              value={show ? String(vaultsCount) : "—"}
              info="Vaults where you currently hold a nonzero position."
            />
            <Stat
              label="Current APY"
              value={show ? `${currentApy.toFixed(1)}%` : "—"}
              info="Position-weighted across your held vaults' own real APYs (each vault's allocation-weighted adapter yield)."
            />
            <Stat
              label="30-day APY"
              value="—"
              info="Not available yet - this needs a share-price history Vigil doesn't index today."
            />
          </div>
        </div>
        <AllocationDonut allocations={show ? allocations : []} total={show ? totalValueUsd : 0} />
      </div>
    </CornerFrame>
  );
}
