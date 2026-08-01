// ─────────────────────────────────────────────────────────────
// useProtocolsTable — builds the headless table instance.
// Owns sort defaults, global search filter, watch-only pre-filter.
// Returns the instance so both the toolbar (counts) and table (rows)
// read one source of truth.
// ─────────────────────────────────────────────────────────────

import { useMemo, useState, useCallback, type MouseEvent } from "react";
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

// ─── CONSTANTS ───
// Worst-first: the entire value prop of a risk monitor is surfacing the
// collapse before you'd think to look for it.
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
interface UseProtocolsTableArgs {
  data: ProtocolRow[];
  watchlisted: Set<string>;
  onToggleWatch: (id: string) => void;
}

export function useProtocolsTable({
  data,
  watchlisted,
  onToggleWatch,
}: UseProtocolsTableArgs) {
  // state
  const [sorting, setSorting] = useState<SortingState>(DEFAULT_SORT);
  const [rawQuery, setRawQuery] = useState("");
  const [watchOnly, setWatchOnly] = useState(false);
  const query = useDebouncedValue(rawQuery, 200);

  // handlers
  const handleToggleWatch = useCallback(
    (id: string, e: MouseEvent) => {
      e.stopPropagation(); // row click must not fire on the star
      onToggleWatch(id);
    },
    [onToggleWatch]
  );

  // derived — watch-only narrows the dataset before the table sees it
  const rows = useMemo(
    () => (watchOnly ? data.filter((d) => watchlisted.has(d.id)) : data),
    [data, watchOnly, watchlisted]
  );

  const columns = useMemo(
    () =>
      buildColumns({
        isWatched: (id) => watchlisted.has(id),
        onToggleWatch: handleToggleWatch,
      }),
    [watchlisted, handleToggleWatch]
  );

  const table = useReactTable({
    data: rows,
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
    watchOnly,
    setWatchOnly,
    query,
    // counts
    visibleCount: table.getRowModel().rows.length,
    totalCount: data.length,
  };
}