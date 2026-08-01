import { Section } from "./Section";
import { severityColor } from "@/shared/health";
import type { RiskRow } from "../types";

export function RiskAnalysis({ risk }: { risk: RiskRow[] }) {
  if (risk.length === 0) return null;
  return (
    <Section title="Risk analysis" aside={<span className="font-mono text-xs text-muted/50">{risk.length}</span>}>
      <ul className="space-y-3">
        {risk.map((r, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-0.5 h-full min-h-[2.5rem] w-0.5 shrink-0" style={{ backgroundColor: severityColor(r.severity) }} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-body">{r.title}</span>
                <span className="font-mono text-xs uppercase tracking-wider" style={{ color: severityColor(r.severity) }}>
                  {r.severity}
                </span>
                <span className="font-mono text-xs text-muted/50">{r.category}</span>
              </div>
              <p className="mt-0.5 text-sm text-muted">{r.note}</p>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}