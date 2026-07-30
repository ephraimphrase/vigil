"use client";

// ─────────────────────────────────────────────────────────────
// VaultsPage — vault picker. A real table (header + search + sortable
// columns), not cards - vaults are comparison data (TVL, APY, risk), and
// every other entity list in this app (protocols, strategies) is already a
// table; cards would've been the odd one out. Empty state (no vaults, or a
// search with no matches) is the same EmptyState the other tables use, so
// "nothing here" never just renders blank. Row click goes to the
// Yearn-style detail + deposit panel at /vault/[slug].
// ─────────────────────────────────────────────────────────────

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { useVaultsTable } from "@/hooks/useVaultsTable";
import { CornerFrame } from "@/components/ui/CornerFrame";
import { VaultsHeader } from "@/components/VaultsHeader";
import { VaultsToolbar } from "@/components/VaultsToolbar";
import { VaultsTable } from "@/components/VaultsTable";
import type { VaultSummary } from "@/types";

export default function VaultsPage() {
  const router = useRouter();
  const vaults = useApi<VaultSummary[]>("/api/vaults", []);
  const onOpenVault = useCallback((slug: string) => router.push(`/vault/${slug}`), [router]);

  const { table, rawQuery, setRawQuery, query, visibleCount, totalCount } = useVaultsTable(vaults);

  return (
    <div className="flex flex-col gap-4 p-4">
      <VaultsHeader visibleCount={visibleCount} totalCount={totalCount} />
      <VaultsToolbar query={rawQuery} onQueryChange={setRawQuery} />
      <CornerFrame>
        <VaultsTable table={table} query={query} onOpenVault={onOpenVault} />
      </CornerFrame>
    </div>
  );
}
