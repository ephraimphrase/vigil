"use client";

// ─────────────────────────────────────────────────────────────
// VaultsPage — vault picker. A real table (header + search + sortable
// columns), not cards - vaults are comparison data (TVL, APY, risk), and
// every other entity list in this app (protocols, strategies) is already a
// table; cards would've been the odd one out. Empty state (no vaults, or a
// search with no matches) is the same EmptyState the other tables use, so
// "nothing here" never just renders blank. Row click stays inside the
// dashboard shell (/dashboard/vault/[slug]) rather than dropping to the
// bare public /vault/[slug] route - same split as protocols
// (/dashboard/protocols/[id] vs /protocols/[id]), both rendering the same
// VaultDetailView so the two can't drift apart.
// ─────────────────────────────────────────────────────────────

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { useVaultsTable } from "@/hooks/useVaultsTable";
import { CornerFrame } from "@/components/ui/CornerFrame";
import { VaultsHeader } from "@/components/Vault/VaultsHeader";
import { VaultsToolbar } from "@/components/Vault/VaultsToolbar";
import { VaultsTable } from "@/components/Vault/VaultsTable";
import type { VaultSummary } from "@/types";

export default function VaultsPage() {
  const router = useRouter();
  const { data: vaults, isLoading } = useApi<VaultSummary[]>("/api/vaults", []);
  const onOpenVault = useCallback((slug: string) => router.push(`/dashboard/vault/${slug}`), [router]);

  const { table, rawQuery, setRawQuery, query, visibleCount, totalCount } = useVaultsTable(vaults);

  return (
    <div className="flex flex-col gap-4 p-4">
      <VaultsHeader visibleCount={visibleCount} totalCount={totalCount} />
      <VaultsToolbar query={rawQuery} onQueryChange={setRawQuery} />
      <CornerFrame>
        <VaultsTable table={table} query={query} isLoading={isLoading} onOpenVault={onOpenVault} />
      </CornerFrame>
    </div>
  );
}
