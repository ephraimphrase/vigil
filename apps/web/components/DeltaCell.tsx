
import { deltaColor } from "../config/bands.config";
import { fmtSigned } from "../shared/format";

interface DeltaCellProps {
  value: number;
  suffix?: string;
}

export function DeltaCell({ value, suffix }: DeltaCellProps) {
  return (
    <span
      className="font-mono text-sm tabular-nums text-text-muted"
      style={{ color: deltaColor(value) }}
    >
      {fmtSigned(value, suffix)}
    </span>
  );
}