import { BAND_META } from "@/shared/health";
import type { RiskCheckRow } from "@/types";

const PASS = BAND_META.hold.color;
const FAIL = BAND_META.exit.color;

export function VaultRiskChecklist({ rows }: { rows: RiskCheckRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-start gap-2 py-4">
        <span className="font-mono text-xs uppercase tracking-wider text-muted">No checks run yet</span>
        <span className="text-sm text-muted/60">This vault&apos;s risk gates haven&apos;t been evaluated.</span>
      </div>
    );
  }

  const failed = rows.filter((r) => !r.passed).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-end">
        <span className="font-mono text-xs uppercase tracking-wider" style={{ color: failed > 0 ? FAIL : PASS }}>
          {failed > 0 ? `${failed} flagged` : "All clear"}
        </span>
      </div>
      <ul className="divide-y divide-hairline/40">
        {rows.map((r) => (
          <li key={r.id} className="flex items-start gap-3 py-2.5">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: r.passed ? PASS : FAIL }} />
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm text-body">{r.label}</span>
                <span className="font-mono text-xs uppercase tracking-wider" style={{ color: r.passed ? PASS : FAIL }}>
                  {r.passed ? "Pass" : "Flag"}
                </span>
              </div>
              {r.note && <p className="text-sm text-muted">{r.note}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
