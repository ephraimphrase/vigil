import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type SortingState,
  type FilterFn,
} from "@tanstack/react-table";

import type { ProtocolRow } from "../types";
import { buildColumns } from "../components/Protocol/Columns";
import { useDebouncedValue } from "./useDebouncedValue";

const DEFAULT_SORT: SortingState = [{ id: "score", desc: false }];

// ─── UTILS ───
const searchFilter: FilterFn<ProtocolRow> = (row, _id, value) => {
  const q = String(value).toLowerCase();
  const r = row.original;
  return (
    r.name.toLowerCase().includes(q) ||
    r.ticker.toLowerCase().includes(q) ||
    r.id.toLowerCase().includes(q)
  );
};

// ─── MAIN ───
export function useProtocolsTable({ data }: { data: ProtocolRow[] }) {
  // state
  const [sorting, setSorting] = useState<SortingState>(DEFAULT_SORT);
  const [rawQuery, setRawQuery] = useState("");
  const query = useDebouncedValue(rawQuery, 200);

  const columns = useMemo(() => buildColumns(), []);

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
    // toolbar bindings
    rawQuery,
    setRawQuery,
    query,
    // counts
    visibleCount: table.getRowModel().rows.length,
    totalCount: data.length,
  };
}
