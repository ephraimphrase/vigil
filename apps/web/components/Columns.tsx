// ─────────────────────────────────────────────────────────────
// Protocols · column definitions
// Headless column defs only — each cell delegates to a cell component.
// Watchlist column is injected here via factory (needs live state).
// ─────────────────────────────────────────────────────────────

import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { MouseEvent } from "react";

import type { ProtocolRow } from "../types";
import { fmtUsd } from "../lib/format";
import { WatchDot } from "./ui/WatchDot";
import { ScoreCell } from "./ScoreCell";
import { DeltaCell } from "./DeltaCell";
import { BandLabel } from "./BandLabel";
import { RiskChips } from "./RiskChips";

// ─── TYPES ───
interface ColumnDeps {
  isWatched: (id: string) => boolean;
  onToggleWatch: (id: string, e: MouseEvent) => void;
}

// ─── MAIN ───
const col = createColumnHelper<ProtocolRow>();

export function buildColumns({
  isWatched,
  onToggleWatch,
}: ColumnDeps): ColumnDef<ProtocolRow, any>[] {
  return [
    col.display({
      id: "watch",
      header: () => null,
      cell: ({ row }) => (
        <WatchDot
          active={isWatched(row.original.id)}
          onToggle={(e) => onToggleWatch(row.original.id, e)}
        />
      ),
    }),
    col.accessor("name", {
      header: "Protocol",
      cell: ({ row }) => (
        <div className="flex flex-col leading-tight">
          <span className="text-sm text-text">{row.original.name}</span>
          <span className="font-mono text-xs text-text-muted">
            {row.original.ticker}
          </span>
        </div>
      ),
    }),
    col.accessor("score", {
      header: "Health",
      cell: ({ getValue }) => <ScoreCell score={getValue()} />,
    }),
    col.accessor("delta24h", {
      header: "24h \u0394",
      cell: ({ getValue }) => <DeltaCell value={getValue()} />,
    }),
    col.accessor("tvl", {
      header: "TVL",
      cell: ({ getValue }) => (
        <span className="font-mono text-sm tabular-nums text-text">
          {fmtUsd(getValue())}
        </span>
      ),
    }),
    col.accessor("tvlDelta24h", {
      header: "TVL 24h",
      cell: ({ getValue }) => <DeltaCell value={getValue()} suffix="%" />,
    }),
    col.accessor("score", {
      id: "action",
      header: "Action",
      enableSorting: false,
      cell: ({ getValue }) => <BandLabel score={getValue()} />,
    }),
    col.accessor("riskFlags", {
      header: "Flags",
      enableSorting: false,
      cell: ({ getValue }) => <RiskChips flags={getValue()} />,
    }),
  ];
}