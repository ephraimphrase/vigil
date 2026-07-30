import { fmtPct } from "@/shared/format";

interface WeightBarProps {
  actual: number;  // 0–1
  target: number;  // 0–1
}

export function WeightBar({ actual, target }: WeightBarProps) {
  const a = Math.min(1, Math.max(0, actual));
  const t = Math.min(1, Math.max(0, target));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between font-mono text-xs">
        <span className="text-muted/60">weight</span>
        <span className="text-muted">
          <span className="text-body">{fmtPct(a)}</span>
          <span className="text-muted/40"> / {fmtPct(t)}</span>
        </span>
      </div>
      <div className="relative h-1.5 w-full rounded-none bg-hairline/20">
        <div className="h-full bg-violet/70" style={{ width: `${a * 100}%` }} />
        {/* target tick */}
        <span className="absolute top-[-2px] h-[10px] w-px bg-body" style={{ left: `${t * 100}%` }} title="target" />
      </div>
    </div>
  );
}
