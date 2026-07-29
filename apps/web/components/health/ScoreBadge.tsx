// ─────────────────────────────────────────────────────────────
// ScoreBadge — compact score readout: mono numeral + band-colored rule.
// Shared by Overview (compact rows) and Strategies (cards) so there's one
// health display, two densities. `size` toggles density.
// ─────────────────────────────────────────────────────────────

import { bandColor } from "@/lib/health";
import { fmtScore } from "@/lib/format";

interface ScoreBadgeProps {
  score: number;
  size?: "sm" | "lg";
}

export function ScoreBadge({ score, size = "sm" }: ScoreBadgeProps) {
  const color = bandColor(score);
  const big = size === "lg";
  return (
    <div className="flex items-center gap-2">
      <span className={big ? "h-8 w-1" : "h-4 w-0.5"} style={{ backgroundColor: color }} />
      <span className={`font-mono tabular-nums text-body ${big ? "text-3xl" : "text-sm"}`}>
        {fmtScore(score)}
      </span>
    </div>
  );
}
