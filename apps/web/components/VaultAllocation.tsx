// ─────────────────────────────────────────────────────────────
// VaultAllocation — pool-wide allocation (actual vs target) per strategy.
// Pooled model: this is the whole pool's split, not per-depositor. Reuses
// the shared WeightBar + ScoreBadge. Rows link to protocol detail.
// ─────────────────────────────────────────────────────────────

import type { ComponentType, ReactNode } from "react";
import { WeightBar } from "@/components/ui/WeightBar";
import { ScoreBadge } from "@/components/health/ScoreBadge";
import { fmtUsd } from "@/shared/format";
import type { AllocationRow } from "@/types";

type LinkLike = ComponentType<{ href: string; className?: string; children: ReactNode }>;
const DefaultLink: LinkLike = ({ href, className, children }) => <a href={href} className={className}>{children}</a>;

export function VaultAllocation({ rows, Link = DefaultLink }: { rows: AllocationRow[]; Link?: LinkLike }) {
  return (
    <section className="rounded-none border border-hairline bg-panel/20">
      <header className="flex items-center justify-between border-b border-hairline px-4 py-2">
        <span className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-violet-bright">
          <span className="h-1.5 w-1.5 rounded-full bg-violet" /> Allocation
        </span>
        <span className="font-mono text-xs text-muted/50">pool-wide · actual / target</span>
      </header>
      <ul className="divide-y divide-hairline/40">
        {rows.map((r) => (
          <li key={r.protocolId} className="grid grid-cols-[minmax(96px,1fr)_minmax(140px,1.6fr)_auto_auto] items-center gap-4 px-4 py-3">
            <Link href={`/protocol/${r.protocolId}`} className="flex flex-col transition-colors hover:text-violet-bright">
              <span className="text-sm text-body">{r.name}</span>
              <span className="font-mono text-xs uppercase tracking-wider text-muted/50">{r.category}</span>
            </Link>
            <WeightBar actual={r.actualWeight} target={r.targetWeight} />
            <span className="w-20 text-right font-mono text-sm tabular-nums text-muted">{fmtUsd(r.valueUsd)}</span>
            <div className="w-12 justify-self-end"><ScoreBadge score={r.score} /></div>
          </li>
        ))}
      </ul>
    </section>
  );
}
