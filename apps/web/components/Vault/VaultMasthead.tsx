// ─────────────────────────────────────────────────────────────
// VaultMasthead — the page's one corner-node frame (motif budget: masthead
// only, per DESIGN.md §7a). Glanceable identity: icon, name, chain, policy
// badge, TVL, headline APY, your deposit. Granular numbers (shares, share
// price, deployed vs. idle) live in VaultPositionSummary below, not here.
// The long per-vault description moved to the Vault Info tab - Yearn's own
// masthead doesn't carry prose either, just identity + stats.
// ─────────────────────────────────────────────────────────────

import { CornerFrame } from "@/components/ui/CornerFrame";
import { Chip } from "@/components/ui/Chip";
import { TokenIconStack } from "@/components/Vault/TokenIcon";
import { assetsOf } from "@/components/Vault/vaultFilters";
import { fmtUsd } from "@/shared/format";
import type { VaultInfo, VaultPolicy } from "@/types";

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
  /** Connected wallet's current position value in this vault, in USD - null when not connected or the asset has no live price yet. */
  depositedUsd: number | null;
  apy: number;
}

export function VaultMasthead({ info, policy, depositedUsd, apy }: VaultMastheadProps) {
  return (
    <CornerFrame>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 p-5">
          <TokenIconStack symbols={assetsOf(info)} logoURIs={[info.assetLogoURI]} size="lg" />
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl leading-none tracking-tight text-body">{info.name}</h1>
              <Chip mono>{policy.name}</Chip>
            </div>
            <span className="font-mono text-xs uppercase tracking-wider text-muted/60">{info.chain}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-hairline border-t border-hairline md:border-t-0 md:border-l">
          <Stat label="TVL" value={Number.isFinite(info.tvl) ? fmtUsd(info.tvl) : "-"} />
          <Stat label="APY" value={`${apy.toFixed(1)}%`} />
          <Stat label="Your deposit" value={depositedUsd != null ? fmtUsd(depositedUsd) : "—"} />
        </div>
      </div>
    </CornerFrame>
  );
}
