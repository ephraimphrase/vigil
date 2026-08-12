// ─────────────────────────────────────────────────────────────
// VaultAllocation — the Strategies tab: donut + sortable, expandable
// table of the vault's own adapters, real (Ponder's `adapter` entity -
// lib/ponder/mappers/vaultStrategies.ts). Every adapter the vault has
// ever added, active/paused/retired alike - "what strategies has this
// vault used" is the point, not just what's currently live.
//
// No per-strategy management/performance fee row (unlike a Yearn-style
// reference) - VigilVault's fees are vault-level, not per-adapter; adapters
// don't charge their own fees in this contract system, so showing a fake
// "0.00%" would just be lying. Expanded detail shows what's actually
// real instead: status, last harvest, and the adapter's own address
// (via the existing <Address> component - copy + block-explorer link
// already built in).
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import moment from "moment";
import { ChevronDown } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
  type SortingState,
  type Row as TableRow,
} from "@tanstack/react-table";
import { AllocationDonut } from "@/components/Overview/AllocationDonut";
import { Address } from "@/components/ui/Address";
import { Chip } from "@/components/ui/Chip";
import { fmtUsd } from "@/shared/format";
import type { VaultStrategyRow } from "@/types";

type Status = "active" | "paused" | "retired";

const STATUS_COLOR: Record<Status, string> = {
  active: "#5FD08A",
  paused: "#E0A95F",
  retired: "#9F95AB",
};
const STATUS_LABEL: Record<Status, string> = {
  active: "Active",
  paused: "Paused",
  retired: "Retired",
};

function statusOf(s: VaultStrategyRow): Status {
  if (s.retired) return "retired";
  if (s.paused) return "paused";
  return "active";
}

interface StrategyRowData extends VaultStrategyRow {
  allocationPct: number;
}

const col = createColumnHelper<StrategyRowData>();

const GRID_COLS = "grid-cols-[1fr_auto_auto_auto_1rem]";

function SortCaret({ dir }: { dir: false | "asc" | "desc" }) {
  return (
    <span className="ml-1 font-mono text-[10px] text-muted/40">
      {dir === "asc" ? "↑" : dir === "desc" ? "↓" : ""}
    </span>
  );
}

const columns = [
  col.accessor("stratName", {
    header: "Strategy",
    cell: (c) => {
      const s = c.row.original;
      return (
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: STATUS_COLOR[statusOf(s)] }} />
          <span className="truncate text-sm text-body">{s.stratName}</span>
        </div>
      );
    },
  }),
  col.accessor("allocationPct", {
    header: "Allocation %",
    cell: (c) => <span className="font-mono text-sm tabular-nums text-body">{(c.getValue() * 100).toFixed(1)}%</span>,
  }),
  col.accessor("allocated", {
    header: "Amount",
    cell: (c) => {
      const s = c.row.original;
      return (
        <span className="font-mono text-sm tabular-nums text-body">
          {s.allocatedUsd != null ? fmtUsd(s.allocatedUsd) : s.allocated.toLocaleString("en-US", { maximumFractionDigits: 2 })}
        </span>
      );
    },
  }),
  col.accessor("apy", {
    header: "APY",
    cell: (c) => <span className="font-mono text-sm tabular-nums text-muted">{c.getValue().toFixed(2)}%</span>,
  }),
];

function StrategyRow({ row, chain }: { row: TableRow<StrategyRowData>; chain: string }) {
  const [open, setOpen] = useState(false);
  const s = row.original;
  const status = statusOf(s);

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`grid w-full ${GRID_COLS} cursor-pointer items-center gap-4 py-3 text-left transition-colors hover:bg-panel/40`}
      >
        {row.getVisibleCells().map((cell) => (
          <div key={cell.id} className={cell.column.id === "stratName" ? "min-w-0" : "text-right"}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </div>
        ))}
        <ChevronDown className={`size-3.5 shrink-0 justify-self-end text-muted/50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <div className={`grid transition-[grid-template-rows] duration-200 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="flex flex-col gap-2 px-4 pb-4 pl-7 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted/60">Status</span>
              <Chip mono dotColor={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</Chip>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted/60">Last harvest</span>
              <span className="text-body">{s.lastHarvestAt ? moment(s.lastHarvestAt).fromNow() : "Never"}</span>
            </div>
            {s.lastHarvestGainUsd != null && (
              <div className="flex items-center justify-between">
                <span className="text-muted/60">Last harvest gain</span>
                <span className="text-body">{fmtUsd(s.lastHarvestGainUsd)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted/60">Address</span>
              <Address address={s.id} chain={chain} />
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

export function VaultAllocation({ strategies, chain }: { strategies: VaultStrategyRow[]; chain: string }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "allocationPct", desc: true }]);

  const totalAllocated = strategies.reduce((sum, s) => sum + s.allocated, 0);
  const totalUsd = strategies.reduce((sum, s) => sum + (s.allocatedUsd ?? 0), 0);

  const rows = useMemo<StrategyRowData[]>(
    () => strategies.map((s) => ({ ...s, allocationPct: totalAllocated > 0 ? s.allocated / totalAllocated : 0 })),
    [strategies, totalAllocated],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (strategies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 py-8">
        <span className="font-mono text-xs uppercase tracking-wider text-muted">No strategies yet</span>
        <span className="text-sm text-muted/60">This vault hasn&apos;t added a protocol adapter yet.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AllocationDonut
        allocations={strategies.map((s) => ({ name: s.stratName, valueUsd: s.allocatedUsd ?? s.allocated }))}
        total={totalUsd || totalAllocated}
      />

      <div>
        <div className={`grid ${GRID_COLS} items-center gap-4 border-b border-hairline/60 pb-2`}>
          {table.getHeaderGroups()[0]?.headers.map((header) => {
            const canSort = header.column.getCanSort();
            return (
              <div
                key={header.id}
                onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                className={`select-none font-mono text-xs uppercase tracking-wider text-muted/60 ${
                  canSort ? "cursor-pointer hover:text-body" : ""
                } ${header.id === "stratName" ? "" : "text-right"}`}
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
                {canSort && <SortCaret dir={header.column.getIsSorted()} />}
              </div>
            );
          })}
          <span />
        </div>

        <ul className="divide-y divide-hairline/40">
          {table.getRowModel().rows.map((row) => <StrategyRow key={row.original.id} row={row} chain={chain} />)}
        </ul>
      </div>
    </div>
  );
}
