"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
} from "@tanstack/react-table";

import { useStrategies } from "../../../hooks/useStrategies";
import { aggregate } from "../../../lib/rebalance";
import { StrategiesHeader } from "../../../components/StrategiesHeader";
import { StrategiesTable } from "../../../components/StrategiesTable";
import { buildStrategyColumns } from "../../../components/StrategyColumns";

const DEFAULT_SORT: SortingState = [{ id: "score", desc: false }];

export default function StrategiesPage() {
  const router = useRouter();
  const data = useStrategies();
  const agg = aggregate(data.strategies);

  const [sorting, setSorting] = useState<SortingState>(DEFAULT_SORT);
  const columns = useMemo(() => buildStrategyColumns(), []);
  const table = useReactTable({
    data: data.strategies,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <StrategiesHeader data={data} />

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
          isLoading={false}
          onOpenStrategy={(protocolId) => router.push(`/dashboard/strategies/${protocolId}`)}
        />
      </div>
    </div>
  );
}
