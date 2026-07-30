// ─────────────────────────────────────────────────────────────
// VaultStrategies — compact per-protocol breakdown (allocation %, amount,
// health, APY), top rows only, linking out to /dashboard/strategies for the
// full sortable table. Deliberately NOT a second copy of StrategiesTable:
// same Strategy[] data source, just a shorter, unsorted read here so the
// two views can't drift apart.
// ─────────────────────────────────────────────────────────────

import Link from "next/link";
import { Section } from "@/components/Section";
import { ScoreBadge } from "@/components/health/ScoreBadge";
import { fmtUsd, fmtPct } from "@/shared/format";
import type { Strategy } from "@/types";

// ─── CONSTANTS ───
const MAX_ROWS = 5;
const ROW_COLS = "minmax(120px,1.6fr) 64px 84px 60px 56px";

// ─── MAIN ───
export function VaultStrategies({ strategies }: { strategies: Strategy[] }) {
  const rows = [...strategies].sort((a, b) => b.allocated - a.allocated).slice(0, MAX_ROWS);
  const overflow = strategies.length - rows.length;

  return (
    <Section
      title="Strategies"
      aside={
        <Link href="/dashboard/strategies" className="font-mono text-xs text-muted/60 transition-colors hover:text-violet-bright">
          View all {"↗"}
        </Link>
      }
    >
      <ul className="divide-y divide-hairline/40">
        {rows.map((s) => (
          <li key={s.id}>
            <Link
              href={`/dashboard/strategies/${s.id}`}
              className="grid items-center gap-4 py-2 transition-colors hover:text-violet-bright"
              style={{ gridTemplateColumns: ROW_COLS }}
            >
              <div className="flex flex-col">
                <span className="text-sm text-body">{s.name}</span>
                <span className="font-mono text-xs uppercase tracking-wider text-muted/50">{s.category}</span>
              </div>
              <span className="font-mono text-xs tabular-nums text-muted">{fmtPct(s.actualWeight)}</span>
              <span className="font-mono text-xs tabular-nums text-muted">{fmtUsd(s.allocated)}</span>
              <span className="font-mono text-xs tabular-nums text-muted">{s.apy.toFixed(1)}%</span>
              <div className="justify-self-end"><ScoreBadge score={s.score} /></div>
            </Link>
          </li>
        ))}
      </ul>
      {overflow > 0 && (
        <div className="mt-2 font-mono text-xs text-muted/50">+{overflow} more — see full table</div>
      )}
    </Section>
  );
}
