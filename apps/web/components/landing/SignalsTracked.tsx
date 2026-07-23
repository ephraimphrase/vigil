// ─── CONSTANTS ─────────────────────────────────────
const ONCHAIN = [
    "TVL trend",
    "Liquidation spikes",
    "Whale & team outflows",
    "Contract pause events",
    "Governance risk",
  ];
  
  const OFFCHAIN = [
    "GitHub commit velocity",
    "Social sentiment",
    "Security & exploit news",
    "Team wallet activity",
    "Regulatory news",
  ];
  
  // ─── COMPONENT ─────────────────────────────────────
  export function SignalsTracked() {
    return (
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
          <div className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-violet-bright">
            <span className="h-1.5 w-1.5 rounded-full bg-violet" />
            What it watches
          </div>
          <h2 className="mb-9 font-display text-3xl font-bold sm:text-4xl">
            Every signal, all the time.
          </h2>
  
          <div className="grid gap-8 sm:grid-cols-2">
            <TagColumn label="Onchain" tags={ONCHAIN} />
            <TagColumn label="Offchain" tags={OFFCHAIN} />
          </div>
        </div>
      </section>
    );
  }
  
  // ─── SUBCOMPONENT ─────────────────────────────────────
  function TagColumn({ label, tags }: { label: string; tags: string[] }) {
    return (
      <div>
        <h3 className="mb-4 font-mono text-sm uppercase tracking-wide text-text-dim">{label}</h3>
        <div className="flex flex-wrap gap-2.5">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-border-strong bg-surface px-4 py-2 text-sm"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    );
  }