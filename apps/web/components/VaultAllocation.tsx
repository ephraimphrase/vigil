// ─────────────────────────────────────────────────────────────
// VaultAllocation — the vault's own per-protocol breakdown: what it's
// earning (APY, health) and whether the pool is where its policy says it
// should be (actual vs target weight). One honest table instead of two
// overlapping ones - an earlier pass split "what's earning" and "is it on
// target" into separate sections, but both read off the same rows, so they
// merged. "View all strategies" still links out to /dashboard/strategies:
// that page carries operational detail (fees, harvest cadence, pause
// state) this summary doesn't need.
// ─────────────────────────────────────────────────────────────

import Link from "next/link";
import { Section } from "@/components/Section";
import { WeightBar } from "@/components/ui/WeightBar";
import { ScoreBadge } from "@/components/health/ScoreBadge";
import { fmtUsd } from "@/shared/format";
import type { AllocationRow } from "@/types";

export function VaultAllocation({ rows }: { rows: AllocationRow[] }) {
  return (
    <Section
      title="Strategies"
      aside={
        <Link href="/dashboard/strategies" className="font-mono text-xs text-muted/50 transition-colors hover:text-violet-bright">
          View all {"↗"}
        </Link>
      }
    >
      <ul className="divide-y divide-hairline/40">
        {rows.map((r) => (
          <li key={r.protocolId} className="grid grid-cols-[minmax(96px,1fr)_minmax(140px,1.4fr)_64px_auto_auto] items-center gap-4 py-3">
            <Link href={`/protocols/${r.protocolId}`} className="flex flex-col transition-colors hover:text-violet-bright">
              <span className="text-sm text-body">{r.name}</span>
              <span className="font-mono text-xs uppercase tracking-wider text-muted/50">{r.category}</span>
            </Link>
            <WeightBar actual={r.actualWeight} target={r.targetWeight} />
            <span className="font-mono text-xs tabular-nums text-muted">{r.apy.toFixed(1)}%</span>
            <span className="w-20 text-right font-mono text-sm tabular-nums text-muted">{fmtUsd(r.valueUsd)}</span>
            <div className="w-12 justify-self-end"><ScoreBadge score={r.score} /></div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
