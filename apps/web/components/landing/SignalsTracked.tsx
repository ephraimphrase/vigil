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

     
        <svg style={{ position: "absolute", width: 0, height: 0 }}>
          <filter id="glass" x="-50%" y="-50%" width="200%" height="200%" primitiveUnits="objectBoundingBox">
            <feImage x="-50%" y="-50%" width="200%" height="200%" result="map" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.02" result="blur" />
            <feDisplacementMap
              in="blur"
              in2="map"
              scale="0.8"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>
      </section>
    );
  }
  
  function TagColumn({ label, tags }: { label: string; tags: string[] }) {
    return (
      <div>
        <h3 className="mb-4 font-mono text-sm uppercase tracking-wide text-text-dim">{label}</h3>
        <div className="flex flex-wrap gap-2.5">
          {tags.map((t) => (
            <span key={t} className="glass-pill rounded-full px-4 py-2 text-sm">
              {t}
            </span>
          ))}
        </div>
      </div>
    );
  }