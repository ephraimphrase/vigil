// ─────────────────────────────────────────────────────────────
// StrategyCard — one per-protocol strategy. Repeating unit → BracketCard.
// Surfaces the rebalance mechanism: live health (ScoreBadge lg), the
// implied action, weight vs target, and the next-action state. Name links
// to the protocol detail page.
// ─────────────────────────────────────────────────────────────

import type { ComponentType, ReactNode } from "react";
import { BracketCard } from "@/components/ui/BracketCard";
import { Chip } from "@/components/ui/Chip";
import { ScoreBadge } from "@/components/health/ScoreBadge";
import { BAND_META, resolveBand } from "@/lib/health";
import { fmtUsd } from "@/lib/format";
import { rebalanceState } from "../lib/rebalance";
import { WeightBar } from "./WeightBar";
import type { Strategy } from "../types";

// ─── UTILS ───
type LinkLike = ComponentType<{ href: string; className?: string; children: ReactNode }>;
const DefaultLink: LinkLike = ({ href, className, children }) => <a href={href} className={className}>{children}</a>;

const hoursAgo = (iso: string) => {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  return h < 1 ? "<1h" : h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`;
};

// ─── COMPONENTS ───
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-sm tabular-nums text-body">{value}</span>
      <span className="font-mono text-xs uppercase tracking-wider text-muted/60">{label}</span>
    </div>
  );
}

// ─── MAIN ───
export function StrategyCard({ strategy, Link = DefaultLink }: { strategy: Strategy; Link?: LinkLike }) {
  const band = BAND_META[resolveBand(strategy.score)];
  const rb = rebalanceState(strategy);

  return (
    <BracketCard className="bg-panel/20">
      <div className="flex flex-col gap-4 p-4">
        {/* header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <Link href={`/protocol/${strategy.protocolId}`} className="text-sm text-body transition-colors hover:text-violet-bright">
              {strategy.name} <span className="font-mono text-xs text-violet-bright">{"\u2197"}</span>
            </Link>
            <span className="font-mono text-xs uppercase tracking-wider text-muted/50">{strategy.category}</span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <ScoreBadge score={strategy.score} size="lg" />
            <span className="font-mono text-xs uppercase tracking-wider" style={{ color: band.color }}>{band.label}</span>
          </div>
        </div>

        {/* weight vs target */}
        <WeightBar actual={strategy.actualWeight} target={strategy.targetWeight} />

        {/* metrics */}
        <div className="grid grid-cols-3 gap-3">
          <Metric label="Allocated" value={fmtUsd(strategy.allocated)} />
          <Metric label="APY" value={`${strategy.apy.toFixed(1)}%`} />
          <Metric label="Rebalanced" value={hoursAgo(strategy.lastRebalance)} />
        </div>

        {/* footer: next action + adapter */}
        <div className="flex items-center justify-between border-t border-hairline/60 pt-3">
          <Chip mono dotColor={rb.color}>{rb.label}</Chip>
          <span className="font-mono text-xs text-muted/40" title="adapter">{strategy.adapter}</span>
        </div>
      </div>
    </BracketCard>
  );
}
