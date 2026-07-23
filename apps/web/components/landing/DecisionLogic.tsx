// ─── TYPES ─────────────────────────────────────
type Band = "healthy" | "caution" | "warn" | "danger";

interface DecisionCard {
  range: string;
  action: string;
  desc: string;
  band: Band;
}

// ─── CONSTANTS ─────────────────────────────────────
const BAND_BORDER: Record<Band, string> = {
  healthy: "border-t-healthy",
  caution: "border-t-[#a3e635]",
  warn: "border-t-warn",
  danger: "border-t-danger",
};

const CARDS: DecisionCard[] = [
  { range: "80 – 100", action: "Hold", desc: "Protocol is healthy. No action taken.", band: "healthy" },
  { range: "60 – 79", action: "Reduce 25%", desc: "Early caution signal. Position trimmed.", band: "caution" },
  { range: "40 – 59", action: "Reduce 50%", desc: "Elevated risk. Exposure cut in half.", band: "warn" },
  { range: "Below 40", action: "Full exit", desc: "Critical. Position closed entirely.", band: "danger" },
];

// ─── COMPONENT ─────────────────────────────────────
export function DecisionLogic() {
  return (
    <section id="decisions" className="py-24 sm:py-32">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <div className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-violet-bright">
          <span className="h-1.5 w-1.5 rounded-full bg-violet" />
          How it decides
        </div>
        <h2 className="mb-9 font-display text-3xl font-bold sm:text-4xl">
          What happens at each score.
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((c) => (
            <div
              key={c.range}
              className={`rounded-2xl border border-t-[3px] border-border bg-surface px-5 py-6 ${BAND_BORDER[c.band]}`}
            >
              <div className="font-mono text-xs uppercase tracking-wide text-text-dim">{c.range}</div>
              <div className="my-2 font-display text-xl font-bold">{c.action}</div>
              <p className="text-sm text-text-muted">{c.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 max-w-2xl border-l-2 border-violet pl-4 text-sm text-text-muted">
          A 15-point drop from a protocol&apos;s 24-hour rolling average triggers immediate
          review — regardless of where the absolute score sits.
        </div>
      </div>
    </section>
  );
}