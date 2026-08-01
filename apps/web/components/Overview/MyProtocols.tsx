import type { ComponentType, ReactNode } from "react";
import { PiVaultLight } from "react-icons/pi";
import { ScoreBadge } from "@/components/Health/ScoreBadge";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Loader } from "@/components/ui/Loader";
import { EmptyState } from "@/components/EmptyState";
import { BAND_META, resolveBand, deltaColor } from "@/shared/health";
import { fmtPct, fmtSigned } from "@/shared/format";
import type { Position } from "../../types";

type LinkLike = ComponentType<{ href: string; className?: string; children: ReactNode }>;
const DefaultLink: LinkLike = ({ href, className, children }) => <a href={href} className={className}>{children}</a>;

function HeaderTerm({ label, info }: { label: string; info: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1">
      {label}
      <InfoTooltip side="bottom">{info}</InfoTooltip>
    </span>
  );
}

interface MyProtocolsProps {
  positions: Position[];
  isLoading?: boolean;
  Link?: LinkLike;
}

export function MyProtocols({ positions, isLoading = false, Link = DefaultLink }: MyProtocolsProps) {
  return (
    <section className="rounded-none border border-hairline bg-panel/20">
      <header className="flex items-center justify-between border-b border-hairline px-4 py-2">
        <span className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-violet-bright">
          <span className="h-1.5 w-1.5 rounded-full bg-violet" /> Your protocols
        </span>
        <span className="flex items-center gap-1.5 font-mono text-xs text-muted/50">
          <HeaderTerm
            label="weight"
            info="Share of the deployed pool sitting in that strategy. The number below it is drift — how far actual weight has moved from the policy's target, which is what triggers a rebalance."
          />
          <span>·</span>
          <HeaderTerm
            label="apy"
            info="The annualized yield that strategy is currently earning — the reward side of the row."
          />
          <span>·</span>
          <HeaderTerm
            label="health"
            info="How safe it is to have money parked here right now — venue solvency and risk, not token price. The risk side of the row."
          />
        </span>
      </header>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader />
        </div>
      ) : positions.length === 0 ? (
        <EmptyState query="" label="protocols" icon={PiVaultLight} message="No positions yet — deposit into a vault to see it here." />
      ) : (
      <ul className="divide-y divide-hairline/40">
        {positions.map((p) => {
          const band = BAND_META[resolveBand(p.score)];
          const drift = p.actualWeight - p.targetWeight;
          return (
            <li key={p.protocolId}>
              <Link href={`/dashboard/protocols/${p.protocolId}`} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-4 py-3 transition-colors hover:bg-panel/40">
                <div className="flex flex-col">
                  <span className="text-sm text-body">{p.name}</span>
                  <span className="font-mono text-xs uppercase tracking-wider text-muted/50">{p.category}</span>
                </div>
                {/* weight + drift */}
                <div className="flex flex-col items-end">
                  <span className="font-mono text-sm tabular-nums text-body">{fmtPct(p.actualWeight)}</span>
                  <span className="font-mono text-xs tabular-nums" style={{ color: deltaColor(drift) }} title="drift vs target">
                    {fmtSigned(drift * 100, "%")}
                  </span>
                </div>
                <span className="w-14 text-right font-mono text-sm tabular-nums text-muted">{p.apy.toFixed(1)}%</span>
                <div className="flex w-28 items-center justify-end gap-2">
                  <span className="font-mono text-xs uppercase tracking-wider" style={{ color: band.color }}>{band.label}</span>
                  <ScoreBadge score={p.score} />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      )}
    </section>
  );
}
