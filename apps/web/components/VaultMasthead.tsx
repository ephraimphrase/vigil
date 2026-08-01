// ─────────────────────────────────────────────────────────────
// VaultMasthead — the page's one corner-node frame (motif budget: masthead
// only, per DESIGN.md §7a). Glanceable identity: name, asset, policy badge,
// TVL, headline APY, your deposit. Granular numbers (shares, share price,
// deployed vs. idle) live in VaultPositionSummary below, not here.
// ─────────────────────────────────────────────────────────────

import { CornerFrame } from "@/components/ui/CornerFrame";
import { Chip } from "@/components/ui/Chip";
import { fmtUsd, fmtUsdFull } from "@/shared/format";
import type { UserPosition, VaultInfo, VaultPolicy } from "@/types";

// ─── UTILS ───
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 px-5 py-4">
      <span className="font-mono text-lg tabular-nums text-violet-bright">{value}</span>
      <span className="font-mono text-xs uppercase tracking-wider text-muted/60">{label}</span>
    </div>
  );
}

// ─── MAIN ───
interface VaultMastheadProps {
  info: VaultInfo;
  policy: VaultPolicy;
  position: UserPosition | null;
  apy: number;
}

export function VaultMasthead({ info, policy, position, apy }: VaultMastheadProps) {
  return (
    <CornerFrame>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 p-5">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl leading-none tracking-tight text-body">{info.name}</h1>
            <Chip mono>{info.asset}</Chip>
            <Chip mono>{policy.name}</Chip>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-muted">
            Pooled {info.asset} vault — one share price and one allocation, shared across every depositor.
          </p>
        </div>
        <div className="grid grid-cols-3 divide-x divide-hairline border-t border-hairline md:border-t-0 md:border-l">
          <Stat label="TVL" value={fmtUsd(info.tvl)} />
          <Stat label="APY" value={`${apy.toFixed(1)}%`} />
          <Stat label="Your deposit" value={position ? fmtUsdFull(position.valueUsd) : "—"} />
        </div>
      </div>
    </CornerFrame>
  );
}
