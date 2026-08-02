// ─── TYPES ─────────────────────────────────────
interface ProtocolTick {
    name: string;
    score: number;
  }
  
  // ─── CONSTANTS ─────────────────────────────────────
  const PROTOCOLS: ProtocolTick[] = [
    { name: "Aave", score: 92 },
    { name: "Curve", score: 81 },
    { name: "Lyra", score: 34 },
    { name: "Compound", score: 88 },
    { name: "Pendle", score: 58 },
    { name: "GMX", score: 76 },
    { name: "Morpho", score: 95 },
  ];
  
  // ─── UTILS ─────────────────────────────────────
  function scoreColor(score: number) {
    if (score >= 70) return "text-healthy";
    if (score >= 40) return "text-warn";
    return "text-danger";
  }
  
  // ─── COMPONENT ─────────────────────────────────────
  export function LiveTicker() {
    const doubled = [...PROTOCOLS, ...PROTOCOLS]; // duplicated once for a seamless loop
  
    return (
      <div className="overflow-hidden rounded-2xl border border-border bg-surface py-3">
        <div className="flex w-max animate-ticker gap-7">
          {doubled.map((p, i) => (
            <span
              key={`${p.name}-${i}`}
              className="flex items-center gap-2 whitespace-nowrap border-r border-border px-5 font-mono text-sm text-text-muted"
            >
              <b className="font-semibold text-text">{p.name}</b>
              <span className={`font-bold ${scoreColor(p.score)}`}>{p.score}</span>
            </span>
          ))}
        </div>
      </div>
    );
  }