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

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { useVaultsTable } from "@/hooks/useVaultsTable";
import { CornerFrame } from "@/components/ui/CornerFrame";
import { VaultsHeader } from "@/components/Vault/VaultsHeader";
import { VaultsFilterBar, type VaultTypeFilter } from "@/components/Vault/VaultsFilterBar";
import { VaultsTable } from "@/components/Vault/VaultsTable";
import {
  EMPTY_ADVANCED_FILTERS,
  vaultKindOf,
  aggressivenessOf,
  assetsOf,
  type VaultFilterState,
} from "@/components/Vault/vaultFilters";
import type { VaultSummary } from "@/types";

export default function VaultsPage() {
  const router = useRouter();
  const { data: vaults, isLoading } = useApi<VaultSummary[]>("/api/vaults", []);
  const onOpenVault = useCallback((slug: string) => router.push(`/dashboard/vault/${slug}`), [router]);

  const [typeFilter, setTypeFilter] = useState<VaultTypeFilter>("all");
  const [chainFilter, setChainFilter] = useState("all");
  const [advancedFilters, setAdvancedFilters] = useState<VaultFilterState>(EMPTY_ADVANCED_FILTERS);

  const chains = useMemo(() => Array.from(new Set(vaults.map((v) => v.chain))).sort(), [vaults]);
  const assets = useMemo(
    () => Array.from(new Set(vaults.flatMap((v) => assetsOf(v)))).sort(),
    [vaults],
  );

  const filteredVaults = useMemo(
    () =>
      vaults.filter((v) => {
        if (typeFilter !== "all" && vaultKindOf(v) !== typeFilter) return false;
        if (chainFilter !== "all" && v.chain !== chainFilter) return false;
        const { assetFilter, minTvl, categoryFilter, aggressivenessFilter } = advancedFilters;
        if (assetFilter.length > 0 && !assetsOf(v).some((a) => assetFilter.includes(a))) return false;
        if (minTvl > 0 && Number.isFinite(v.tvl) && v.tvl < minTvl) return false;
        if (categoryFilter.length > 0 && !categoryFilter.includes(v.assetType)) return false;
        if (aggressivenessFilter.length > 0 && !aggressivenessFilter.includes(aggressivenessOf(v)))
          return false;
        return true;
      }),
    [vaults, typeFilter, chainFilter, advancedFilters],
  );

  const { table, rawQuery, setRawQuery, query, visibleCount, totalCount } = useVaultsTable(filteredVaults);

  return (
    <div className="flex flex-col gap-4 p-4">
      <VaultsHeader visibleCount={visibleCount} totalCount={totalCount} />
      <div className="border-t border-hairline" />
      <VaultsFilterBar
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        chains={chains}
        chainFilter={chainFilter}
        onChainFilterChange={setChainFilter}
        query={rawQuery}
        onQueryChange={setRawQuery}
        assets={assets}
        advancedFilters={advancedFilters}
        onAdvancedFiltersChange={setAdvancedFilters}
      />
      <CornerFrame>
        <VaultsTable table={table} query={query} isLoading={isLoading} onOpenVault={onOpenVault} />
      </CornerFrame>
    </div>
  );
}
