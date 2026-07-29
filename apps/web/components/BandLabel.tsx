import { resolveBand } from "../config/bands.config";

export function BandLabel({ score }: { score: number }) {
  const band = resolveBand(score);
  return (
    <span
      className="font-mono text-xs uppercase tracking-wider"
      style={{ color: band.color }}
    >
      {band.label}
    </span>
  );
}