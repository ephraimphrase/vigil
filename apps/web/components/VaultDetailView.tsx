"use client";

// ─────────────────────────────────────────────────────────────
// VaultDetailView — composition only. The Yearn-style single-vault page:
// masthead → your position → strategies/allocation → policy → risk, with
// the deposit/withdraw rail sticky on the right. Headline APY, weighted
// health, and deployed total all come from vaultAggregate(vault.allocation)
// - this vault's own rows, not the global strategies list - so each vault
// in a multi-vault picker shows its own numbers, never another vault's.
// No data logic of its own beyond that composition.
//
// Rendered from the top-level /vault/[slug] route (see the thin wrapper
// there) - same split as ProtocolDetailView / StrategyDetailView.
// ─────────────────────────────────────────────────────────────

import { useVault } from "@/hooks/useVault";
import { vaultAggregate } from "@/shared/vault";
import { VaultMasthead } from "@/components/VaultMasthead";
import { VaultPositionSummary } from "@/components/VaultPositionSummary";
import { VaultAllocation } from "@/components/VaultAllocation";
import { VaultPolicy } from "@/components/VaultPolicy";
import { VaultRiskChecklist } from "@/components/VaultRiskChecklist";
import { DepositWithdraw } from "@/components/DepositWithdraw";

type Tab = "deposit" | "withdraw";

export function VaultDetailView({ slug, onSubmit }: { slug: string; onSubmit?: (tab: Tab, amount: number) => void }) {
  const vault = useVault(slug);

  if (!vault) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 bg-base p-4">
        <span className="font-mono text-xs uppercase tracking-wider text-muted">Not found</span>
        <span className="text-sm text-muted/60">No vault matches &quot;{slug}&quot;.</span>
      </div>
    );
  }

  const { info, policy, position, allocation, riskChecks } = vault;
  const agg = vaultAggregate(allocation);

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-4 bg-base p-4">
      <VaultMasthead info={info} policy={policy} position={position} apy={agg.weightedApy} />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* main column */}
        <div className="flex min-w-0 flex-col gap-4">
          <VaultPositionSummary info={info} position={position} deployed={agg.deployed} />
          <VaultAllocation rows={allocation} />
          <VaultPolicy policy={policy} />
          <VaultRiskChecklist rows={riskChecks} />
        </div>
        {/* action rail */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <DepositWithdraw info={info} position={position} onSubmit={onSubmit} />
        </div>
      </div>
    </div>
  );
}
