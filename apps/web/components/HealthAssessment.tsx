// ─────────────────────────────────────────────────────────────
// HealthAssessment — the synthesized verdict (agent-agnostic; never
// branded as a specific model). Current summary + risk flags, with a
// collapsible history of past reads.
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { Section } from "./Section";
import { Chip } from "@/components/ui/Chip";
import { dateShort } from "@/lib/format";
import type { Health } from "../types";

export function HealthAssessment({ health }: { health: Health }) {
  const [open, setOpen] = useState(false);
  const { assessment, assessmentHistory } = health;

  return (
    <Section
      title="Assessment"
      aside={
        <span className="font-mono text-xs text-muted">
          {assessment.confidence} confidence · {dateShort(assessment.updatedAt)}
        </span>
      }
    >
      {/* summary — fading annotation treatment */}
      <p className="bg-gradient-to-b from-body to-[#55416E] bg-clip-text text-sm leading-relaxed text-transparent">
        {assessment.summary}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {assessment.riskFlags.map((f) => <Chip key={f} mono>{f}</Chip>)}
      </div>

      {assessmentHistory.length > 0 && (
        <div className="mt-4 border-t border-hairline pt-3">
          <button
            onClick={() => setOpen((v) => !v)}
            className="font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:text-body"
          >
            {open ? "\u2212" : "+"} History ({assessmentHistory.length})
          </button>
          {open && (
            <ul className="mt-3 space-y-2">
              {assessmentHistory.map((h, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="w-12 shrink-0 font-mono text-xs text-muted">{dateShort(h.ts)}</span>
                  <span className="font-mono text-xs text-violet-bright">{h.score}</span>
                  <span className="text-muted">{h.summary}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Section>
  );
}