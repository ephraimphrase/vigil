"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  type SortingState,
} from "@tanstack/react-table";

import { useStrategies } from "../../../hooks/useStrategies";
import { aggregate, groupByProtocol } from "../../../shared/rebalance";
import { StrategiesTable } from "../../../components/StrategiesTable";
import { buildStrategyColumns } from "../../../components/StrategyColumns";
import type { Strategy } from "../../../types";

const DEFAULT_SORT: SortingState = [{ id: "score", desc: false }];

export default function StrategiesPage() {
  const router = useRouter();
  const { data, isLoading } = useStrategies();
  const agg = aggregate(data.strategies);

  // Grouping is a presentational fold of the flat list (one row per
  // protocol, multi-strategy protocols expandable) - aggregate() above
  // still runs on the flat data so vault-wide totals never double-count a
  // group and its children.
  const grouped = useMemo(() => groupByProtocol(data.strategies), [data.strategies]);

  const [sorting, setSorting] = useState<SortingState>(DEFAULT_SORT);
  const columns = useMemo(() => buildStrategyColumns(), []);
  const table = useReactTable({
    data: grouped,
    columns,
    // Every protocol row is permanently expanded - no collapse control
    // anywhere in the UI, so `expanded: true` (not wired to any setter)
    // is a fixed "always all rows expanded" state, not a toggleable one.
    state: { sorting, expanded: true },
    onSortingChange: setSorting,
    getSubRows: (row: Strategy) => row.subRows,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {agg.needsAttention > 0 && (
        <div className="flex items-center gap-2 border-l-2 border-[#E0A95F] bg-panel/20 px-3 py-2">
          <span className="font-mono text-xs uppercase tracking-wider text-[#E0A95F]">
            {agg.needsAttention} {agg.needsAttention === 1 ? "strategy" : "strategies"} pending rebalance
          </span>
        </div>
      )}

      <div className="min-h-0 flex-1 border border-hairline">
        <StrategiesTable
          table={table}
          isLoading={isLoading}
          onOpenStrategy={(id) => router.push(`/dashboard/strategies/${id}`)}
        />
      </div>
    </div>
  );
}
