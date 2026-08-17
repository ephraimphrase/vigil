"use client";

import { useRef } from "react";
import { flexRender, type Table } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

import type { Strategy } from "../../types";
import { STRATEGY_GRID_COLS, ROW_HEIGHT, OVERSCAN } from "../../config/table.config";
import { EmptyState } from "../EmptyState";
import { Loader } from "../ui/Loader";

function SortCaret({ dir }: { dir: false | "asc" | "desc" }) {
  return (
    <span className="ml-1 font-mono text-[10px] text-text-muted/40">
      {dir === "asc" ? "↑" : dir === "desc" ? "↓" : ""}
    </span>
  );
}

function HeaderRow({ table }: { table: Table<Strategy> }) {
  return (
    <div
      className="grid items-center border-b border-[#CAC0D5]/20 px-3 py-2"
      style={{ gridTemplateColumns: STRATEGY_GRID_COLS }}
    >
      {(table.getHeaderGroups()[0]?.headers ?? []).map((header) => {
        const canSort = header.column.getCanSort();
        return (
          <div key={header.id} className="flex items-center gap-2 pr-4">
            <div
              onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
              className={`select-none font-mono text-xs uppercase tracking-wider text-text-muted ${
                canSort ? "cursor-pointer hover:text-text" : ""
              }`}
            >
              {flexRender(header.column.columnDef.header, header.getContext())}
              {canSort && <SortCaret dir={header.column.getIsSorted()} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface StrategiesTableProps {
  table: Table<Strategy>;
  isLoading: boolean;
  onOpenStrategy: (id: string) => void;
}

export function StrategiesTable({ table, isLoading, onOpenStrategy }: StrategiesTableProps) {
  const rows = table.getRowModel().rows;

  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  return (
    <div className="flex h-full flex-col overflow-x-auto">
      <div className="min-w-[600px]">
        <HeaderRow table={table} />
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-12">
          <Loader />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState query="" label="strategies" />
      ) : (
        <div ref={scrollRef} className="min-h-0 min-w-[600px] flex-1 overflow-y-auto">
          <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
            {virtualizer.getVirtualItems().map((vr) => {
              const row = rows[vr.index];
              if (!row) return null;
              const isLeaf = row.depth > 0;
              return (
                <div
                  key={row.id}
                  onClick={isLeaf ? () => onOpenStrategy(row.original.id) : undefined}
                  className={`group absolute left-0 grid w-full items-center border-b border-[#CAC0D5]/20 px-3 transition-colors ${
                    isLeaf ? "cursor-pointer hover:bg-surface-2/60" : ""
                  }`}
                  style={{
                    gridTemplateColumns: STRATEGY_GRID_COLS,
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
