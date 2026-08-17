import { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";

import type { TransactionEntry, TransactionType } from "../types";
import { withinRange, matchesQuery } from "../shared/transactions";
import type { DateRange } from "../components/ui/DateRangePicker";

const col = createColumnHelper<TransactionEntry>();

const DEFAULT_SORT: SortingState = [{ id: "ts", desc: true }];
const EMPTY_RANGE: DateRange = { start: null, end: null };

const COLUMNS = [
  col.accessor("chain", {
    filterFn: (row, id, value: Set<string>) => value.size === 0 || value.has(row.getValue<string>(id)),
  }),
  col.accessor("type", {
    filterFn: (row, id, value: Set<TransactionType>) => value.size === 0 || value.has(row.getValue<TransactionType>(id)),
  }),
  col.accessor("ts", {
    filterFn: (row, id, value: DateRange) => withinRange(row.getValue<string>(id), value),
  }),
];

export function useTransactionsTable(entries: TransactionEntry[]) {
  const [sorting, setSorting] = useState<SortingState>(DEFAULT_SORT);
  const [chainFilter, setChainFilter] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<Set<TransactionType>>(new Set());
  const [dateRange, setDateRange] = useState<DateRange>(EMPTY_RANGE);
  const [query, setQuery] = useState("");

  const columnFilters: ColumnFiltersState = useMemo(
    () => [
      { id: "chain", value: chainFilter },
      { id: "type", value: typeFilter },
      { id: "ts", value: dateRange },
    ],
    [chainFilter, typeFilter, dateRange]
  );

  const table = useReactTable({
    data: entries,
    columns: COLUMNS,
    state: { sorting, columnFilters, globalFilter: query },
    onSortingChange: setSorting,
    onGlobalFilterChange: setQuery,
    globalFilterFn: (row, _id, value: string) => matchesQuery(row.original, value),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return {
    table,
    chainFilter,
    setChainFilter,
    typeFilter,
    setTypeFilter,
    dateRange,
    setDateRange,
    query,
    setQuery,
    visibleCount: table.getRowModel().rows.length,
    totalCount: entries.length,
  };
}
