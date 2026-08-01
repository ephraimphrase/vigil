import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import type { MouseEvent } from "react";

import type { ProtocolRow } from "../../types";
import { fmtUsd } from "../../shared/format";
import { WatchDot } from "../ui/WatchDot";
import { ScoreCell } from "../Health/ScoreCell";
import { DeltaCell } from "../Health/DeltaCell";
import { BandLabel } from "../Health/BandLabel";
import { RiskChips } from "./RiskChips";

interface ColumnDeps {
  isWatched: (id: string) => boolean;
  onToggleWatch: (id: string, e: MouseEvent) => void;
}

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
        <div className="flex items-center gap-2.5">
          <img
            src={row.original.icon}
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 shrink-0 rounded-full"
            loading="lazy"
          />
          <div className="flex flex-col leading-tight">
            <span className="text-sm text-text">{row.original.name}</span>
            <span className="font-mono text-xs text-text-muted">
              {row.original.ticker}
            </span>
          </div>
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