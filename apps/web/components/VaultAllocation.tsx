// ─────────────────────────────────────────────────────────────
// VaultAllocation — pool-wide allocation (actual vs target) per strategy.
// Pooled model: this is the whole pool's split, not per-depositor. Distinct
// question from VaultStrategies (that's "what's the strategy earning",
// this is "is the pool where its policy says it should be") - same
// protocols, different lens, so both sections stay. Reuses the shared
// WeightBar + ScoreBadge. Rows link to protocol detail.
// ─────────────────────────────────────────────────────────────

import Link from "next/link";
import { Section } from "@/components/Section";
import { WeightBar } from "@/components/ui/WeightBar";
import { ScoreBadge } from "@/components/health/ScoreBadge";
import { fmtUsd } from "@/shared/format";
import type { AllocationRow } from "@/types";

export function VaultAllocation({ rows }: { rows: AllocationRow[] }) {
  return (
    <Section title="Allocation" aside={<span className="font-mono text-xs text-muted/50">pool-wide · actual / target</span>}>
      <ul className="divide-y divide-hairline/40">
        {rows.map((r) => (
          <li key={r.protocolId} className="grid grid-cols-[minmax(96px,1fr)_minmax(140px,1.6fr)_auto_auto] items-center gap-4 py-3">
            <Link href={`/protocols/${r.protocolId}`} className="flex flex-col transition-colors hover:text-violet-bright">
              <span className="text-sm text-body">{r.name}</span>
              <span className="font-mono text-xs uppercase tracking-wider text-muted/50">{r.category}</span>
            </Link>
            <WeightBar actual={r.actualWeight} target={r.targetWeight} />
            <span className="w-20 text-right font-mono text-sm tabular-nums text-muted">{fmtUsd(r.valueUsd)}</span>
            <div className="w-12 justify-self-end"><ScoreBadge score={r.score} /></div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
