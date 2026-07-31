"use client";

import { flexRender, type Table } from "@tanstack/react-table";

import type { VaultSummary } from "../types";
import { VAULT_GRID_COLS } from "../config/table.config";
import { EmptyState } from "./EmptyState";
import { Loader } from "./ui/Loader";

function SortCaret({ dir }: { dir: false | "asc" | "desc" }) {
  return (
    <span className="ml-1 font-mono text-[10px] text-muted/40">
      {dir === "asc" ? "↑" : dir === "desc" ? "↓" : ""}
    </span>
  );
}

function HeaderRow({ table }: { table: Table<VaultSummary> }) {
  return (
    <div className="grid items-center border-b border-hairline px-3 py-2" style={{ gridTemplateColumns: VAULT_GRID_COLS }}>
      {table.getHeaderGroups()[0].headers.map((header) => {
        const canSort = header.column.getCanSort();
        return (
          <div
            key={header.id}
            onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
            className={`select-none pr-4 font-mono text-xs uppercase tracking-wider text-muted ${canSort ? "cursor-pointer hover:text-body" : ""}`}
          >
            {flexRender(header.column.columnDef.header, header.getContext())}
            {canSort && <SortCaret dir={header.column.getIsSorted()} />}
          </div>
        );
      })}
    </div>
  );
}

interface VaultsTableProps {
  table: Table<VaultSummary>;
  query: string;
  isLoading: boolean;
  onOpenVault: (slug: string) => void;
}

export function VaultsTable({ table, query, isLoading, onOpenVault }: VaultsTableProps) {
  const rows = table.getRowModel().rows;

  return (
    <div className="flex flex-col">
      <HeaderRow table={table} />
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState query={query} label="vaults" />
      ) : (
        rows.map((row) => (
          <div
            key={row.id}
            onClick={() => onOpenVault(row.original.slug)}
            className="grid cursor-pointer items-center border-b border-hairline/60 px-3 py-3 transition-colors hover:bg-panel/40"
            style={{ gridTemplateColumns: VAULT_GRID_COLS }}
          >
            {row.getVisibleCells().map((cell) => (
              <div key={cell.id} className="pr-4">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
