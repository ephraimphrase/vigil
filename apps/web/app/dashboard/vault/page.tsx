"use client";

// ─────────────────────────────────────────────────────────────
// VaultsPage — vault picker. One row today (Balanced), slug-ready for more:
// add an entry to VAULT_MOCKS and it shows up here with zero page changes.
// Click-through goes to the Yearn-style detail + deposit panel at
// /vault/[slug] - this list stays a picker, not a second copy of that page.
// ─────────────────────────────────────────────────────────────

import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { useStrategies } from "@/hooks/useStrategies";
import { aggregate } from "@/shared/rebalance";
import { BracketCard } from "@/components/ui/BracketCard";
import { Chip } from "@/components/ui/Chip";
import { fmtUsd } from "@/shared/format";
import type { VaultInfo } from "@/types";

// ─── UTILS ───
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-lg tabular-nums text-body">{value}</span>
      <span className="font-mono text-xs uppercase tracking-wider text-muted/60">{label}</span>
    </div>
  );
}

// ─── MAIN ───
export default function VaultsPage() {
  const vaults = useApi<VaultInfo[]>("/api/vaults", []);
  const { strategies } = useStrategies();
  const agg = aggregate(strategies);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vaults.map((v) => (
          <Link key={v.slug} href={`/vault/${v.slug}`}>
            <BracketCard className="bg-panel/10 transition-colors hover:bg-panel/20">
              <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg leading-none text-body">{v.name}</span>
                  <Chip mono>{v.asset}</Chip>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Stat label="TVL" value={fmtUsd(v.tvl)} />
                  <Stat label="APY" value={`${agg.weightedApy.toFixed(1)}%`} />
                </div>
              </div>
            </BracketCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
