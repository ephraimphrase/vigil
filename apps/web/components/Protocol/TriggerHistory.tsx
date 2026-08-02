import { Section } from "../Section";
import { bandColor } from "@/shared/health";
import { dateShort, fmtSigned } from "@/shared/format";
import type { TriggerRecord } from "../../types";

export function TriggerHistory({ triggers }: { triggers: TriggerRecord[] }) {
  return (
    <Section title="Trigger history" aside={<span className="font-mono text-xs text-muted/50">{triggers.length}</span>}>
      {triggers.length === 0 ? (
        <div className="py-2 font-mono text-xs uppercase tracking-wider text-muted/50">No triggers fired</div>
      ) : (
        <ul className="divide-y divide-hairline/40">
          {triggers.map((t, i) => (
            <li key={i} className="grid grid-cols-[64px_60px_60px_auto] items-center gap-3 py-2">
              <span className="font-mono text-xs text-muted">{dateShort(t.ts)}</span>
              <span className="font-mono text-sm text-body">{t.score}</span>
              <span className="font-mono text-xs" style={{ color: bandColor(t.score) }}>{fmtSigned(t.delta)}</span>
              <span className="text-sm text-muted">{t.reason}</span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}