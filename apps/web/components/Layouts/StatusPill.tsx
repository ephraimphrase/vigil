

export type SystemState = "running" | "paused" | "circuit_broken";

const META: Record<SystemState, { label: string; color: string; pulse: boolean }> = {
  running:        { label: "RUNNING",   color: "#5FD08A", pulse: true },
  paused:         { label: "PAUSED",    color: "#E0A95F", pulse: false },
  circuit_broken: { label: "CIRCUIT BROKEN", color: "#E0607F", pulse: false },
};

export function StatusPill({ state }: { state: SystemState }) {
  const m = META[state];
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-hairline px-2.5 py-1 font-mono text-xs uppercase tracking-wider" style={{ color: m.color }}>
      <span className="relative flex h-1.5 w-1.5">
        {m.pulse && <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ backgroundColor: m.color }} />}
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ backgroundColor: m.color }} />
      </span>
      {m.label}
    </span>
  );
}
