"use client";

// ─────────────────────────────────────────────────────────────
// VaultPage — pooled vault. Composition only. Position + allocation in the
// main column, the deposit/withdraw action panel in a sticky rail, policy
// full-width below. No data logic here.
// ─────────────────────────────────────────────────────────────

import type { ComponentType, ReactNode } from "react";
import { useVault } from "../../../hooks/useVault";
import { VaultPosition } from "../../../components/VaultPosition";
import { VaultAllocation } from "../../../components/VaultAllocation";
import { VaultPolicy } from "../../../components/VaultPolicy";
import { DepositWithdraw } from "../../../components/DepositWithdraw";

// ─── TYPES ───
type LinkLike = ComponentType<{ href: string; className?: string; children: ReactNode }>;
type Tab = "deposit" | "withdraw";

interface VaultPageProps {
  Link?: LinkLike;
  onSubmit?: (tab: Tab, amount: number) => void;
}

// ─── MAIN ───
export default function VaultPage({ Link, onSubmit }: VaultPageProps) {
  const { info, policy, position, allocation } = useVault();

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* main column */}
        <div className="flex min-w-0 flex-col gap-4">
          <VaultPosition info={info} position={position} />
          <VaultAllocation rows={allocation} Link={Link} />
        </div>
        {/* action rail */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <DepositWithdraw info={info} position={position} onSubmit={onSubmit} />
        </div>
      </div>
      <VaultPolicy policy={policy} />
    </div>
  );
}