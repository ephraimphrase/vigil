"use client";

// ─────────────────────────────────────────────────────────────
// ProtocolsTable — headless table renderer + row virtualization.
// Native <table> fights the virtualizer, so rows are div-grids aligned
// by GRID_COLS. Handles loading / empty / populated. Dumb: takes a table
// instance, renders it.
// ─────────────────────────────────────────────────────────────

import { useRef } from "react";
import { flexRender, type Table } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

import type { ProtocolRow } from "../types";
import { GRID_COLS, ROW_HEIGHT, OVERSCAN } from "../config/table.config";
import { TableSkeleton } from "./TableSkeleton";
import { EmptyState } from "./EmptyState";

// ─── COMPONENTS ───

function SortCaret({ dir }: { dir: false | "asc" | "desc" }) {
  return (
    <span className="ml-1 font-mono text-[10px] text-text-muted/40">
      {dir === "asc" ? "\u2191" : dir === "desc" ? "\u2193" : ""}
    </span>
  );
}

function HeaderRow({ table }: { table: Table<ProtocolRow> }) {
  return (
    <div
      className="grid items-center border-b border-[#CAC0D5]/20 px-3 py-2"
      style={{ gridTemplateColumns: GRID_COLS }}
    >
      {table.getHeaderGroups()[0].headers.map((header) => {
        const canSort = header.column.getCanSort();
        return (
          <div
            key={header.id}
            onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
            className={`select-none pr-4 font-mono text-xs uppercase tracking-wider text-text-muted ${
              canSort ? "cursor-pointer hover:text-text" : ""
            }`}
          >
            {flexRender(header.column.columnDef.header, header.getContext())}
            {canSort && <SortCaret dir={header.column.getIsSorted()} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── MAIN ───

interface ProtocolsTableProps {
  table: Table<ProtocolRow>;
  query: string;
  isLoading: boolean;
  onOpenProtocol: (id: string) => void;
}

export function ProtocolsTable({
  table,
  query,
  isLoading,
  onOpenProtocol,
}: ProtocolsTableProps) {
  const rows = table.getRowModel().rows;

  // virtualization
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  return (
    <div className="flex h-full flex-col">
      <HeaderRow table={table} />

      {isLoading ? (
        <TableSkeleton />
      ) : rows.length === 0 ? (
        <EmptyState query={query} />
      ) : (
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
          <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
            {virtualizer.getVirtualItems().map((vr) => {
              const row = rows[vr.index];
              return (
                <div
                  key={row.id}
                  onClick={() => onOpenProtocol(row.original.id)}
                  className="group absolute left-0 grid w-full cursor-pointer items-center border-b border-[#CAC0D5]/20 px-3 transition-colors hover:bg-surface-2/60"
                  style={{
                    gridTemplateColumns: GRID_COLS,
                    height: vr.size,
                    transform: `translateY(${vr.start}px)`,
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <div key={cell.id} className="pr-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}