// ─────────────────────────────────────────────────────────────
// useVaultsTable — builds the headless table instance for the /dashboard/
// vault picker. Mirrors useProtocolsTable: sort default, debounced global
// search. No watchlist concept here (that's a protocols thing); no
// virtualization either - a vault picker measures in the dozens at most,
// not the hundreds protocols/strategies can reach, so the extra machinery
// buys nothing yet.
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type SortingState,
  type FilterFn,
} from "@tanstack/react-table";

import type { VaultSummary } from "../types";
import { buildVaultColumns } from "../components/Vault/VaultsColumns";
import { useDebouncedValue } from "./useDebouncedValue";

// ─── CONSTANTS ───
const DEFAULT_SORT: SortingState = [{ id: "tvl", desc: true }];

// ─── UTILS ───
const searchFilter: FilterFn<VaultSummary> = (row, _id, value) => {
  const q = String(value).toLowerCase();
  const r = row.original;
  return r.name.toLowerCase().includes(q) || r.slug.toLowerCase().includes(q);
};

// ─── MAIN ───
export function useVaultsTable(data: VaultSummary[]) {
  const [sorting, setSorting] = useState<SortingState>(DEFAULT_SORT);
  const [rawQuery, setRawQuery] = useState("");
  const query = useDebouncedValue(rawQuery, 200);

  const columns = useMemo(() => buildVaultColumns(), []);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter: query },
    onSortingChange: setSorting,
    globalFilterFn: searchFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return {
    table,
    rawQuery,
    setRawQuery,
    query,
    visibleCount: table.getRowModel().rows.length,
    totalCount: data.length,
  };
}
