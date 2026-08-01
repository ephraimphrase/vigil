import { resolveBand } from "../config/bands.config";
import { fmtScore } from "../shared/format";

export function ScoreCell({ score }: { score: number }) {
  const band = resolveBand(score);
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="h-5 w-0.5 shrink-0"
        style={{ backgroundColor: band.color }}
      />
      <span className="font-mono text-sm tabular-nums text-text">
        {fmtScore(score)}
      </span>
    </div>
  );
}