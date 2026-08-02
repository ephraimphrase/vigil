import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";

import type { ProtocolRow } from "../../types";
import { fmtUsd } from "../../shared/format";
import { ScoreCell } from "../Health/ScoreCell";
import { DeltaCell } from "../Health/DeltaCell";
import { BandLabel } from "../Health/BandLabel";
import { RiskChips } from "./RiskChips";

const col = createColumnHelper<ProtocolRow>();

export function buildColumns(): ColumnDef<ProtocolRow, any>[] {
  return [
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
      header: "24h Δ",
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
