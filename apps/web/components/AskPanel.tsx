// ─────────────────────────────────────────────────────────────
// AskPanel — the overload valve. Pre-seeded questions answered from the
// underlying data; depth lives behind intent, not dumped on the page.
// onAsk is wired to the LLM Q&A surface later.
// ─────────────────────────────────────────────────────────────

import { Section } from "./Section";

interface AskPanelProps {
  suggestions: string[];
  onAsk?: (q: string) => void;
}

export function AskPanel({ suggestions, onAsk }: AskPanelProps) {
  if (suggestions.length === 0) return null;
  return (
    <Section title="Ask">
      <div className="flex flex-col gap-2">
        {suggestions.map((q) => (
          <button
            key={q}
            onClick={() => onAsk?.(q)}
            className="group flex items-center justify-between rounded-none border border-hairline px-3 py-2 text-left text-sm text-muted transition-colors hover:border-hairline/60 hover:text-body"
          >
            {q}
            <span className="font-mono text-xs text-violet-bright opacity-0 transition-opacity group-hover:opacity-100">{"\u2197"}</span>
          </button>
        ))}
      </div>
    </Section>
  );
}