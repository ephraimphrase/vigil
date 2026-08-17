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

import type { ActivityEntry, EventKind } from "../types";
import { withinPreset, type DateRangePreset } from "../shared/activity";

const col = createColumnHelper<ActivityEntry>();

const DEFAULT_SORT: SortingState = [{ id: "ts", desc: true }];

const COLUMNS = [
  col.accessor("kind", {
    filterFn: (row, id, value: Set<EventKind>) => value.has(row.getValue<EventKind>(id)),
  }),
  col.accessor("protocolId", {
    filterFn: (row, id, value: string) => value === "all" || row.getValue(id) === value,
  }),
  col.accessor("ts", {
    filterFn: (row, id, value: DateRangePreset) => withinPreset(row.getValue<string>(id), value),
  }),
];

export function useActivityTable(entries: ActivityEntry[], allKinds: EventKind[]) {
  const [sorting, setSorting] = useState<SortingState>(DEFAULT_SORT);
  const [activeKinds, setActiveKinds] = useState<Set<EventKind>>(new Set(allKinds));
  const [protocolFilter, setProtocolFilter] = useState<string>("all");
  const [datePreset, setDatePreset] = useState<DateRangePreset>("all");

  const columnFilters: ColumnFiltersState = useMemo(
    () => [
      { id: "kind", value: activeKinds },
      { id: "protocolId", value: protocolFilter },
      { id: "ts", value: datePreset },
    ],
    [activeKinds, protocolFilter, datePreset]
  );

  const table = useReactTable({
    data: entries,
    columns: COLUMNS,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return {
    table,
    activeKinds,
    setActiveKinds,
    protocolFilter,
    setProtocolFilter,
    datePreset,
    setDatePreset,
    visibleCount: table.getRowModel().rows.length,
    totalCount: entries.length,
  };
}
