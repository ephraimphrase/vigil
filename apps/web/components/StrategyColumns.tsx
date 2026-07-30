import moment from "moment";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";

import type { Strategy } from "../types";
import { fmtUsd, fmtFeePct } from "../lib/format";
import { ScoreCell } from "./ScoreCell";
import { WeightBar } from "./ui/WeightBar";
import { Chip } from "./ui/Chip";

const col = createColumnHelper<Strategy>();

export function buildStrategyColumns(): ColumnDef<Strategy, any>[] {
  return [
    col.accessor("name", {
      header: "Strategy",
      cell: ({ row }) => (
        <div className="flex flex-col leading-tight" title={row.original.description}>
          <div className="flex items-center gap-2">
            <span className="text-sm text-text">{row.original.name}</span>
            {row.original.retired && <Chip mono dotColor="#E0715F">Retired</Chip>}
            {!row.original.retired && row.original.paused && <Chip mono dotColor="#E0A95F">Paused</Chip>}
          </div>
          <span className="font-mono text-xs text-text-muted">
            {row.original.category} · {row.original.want}
          </span>
        </div>
      ),
    }),
    col.accessor("score", {
      header: "Health",
      cell: ({ getValue }) => <ScoreCell score={getValue()} />,
    }),
    col.accessor("apy", {
      header: "APY",
      cell: ({ getValue }) => (
        <span className="font-mono text-sm tabular-nums text-text">{getValue().toFixed(1)}%</span>
      ),
    }),
    col.accessor("allocated", {
      header: "TVL",
      cell: ({ getValue }) => (
        <span className="font-mono text-sm tabular-nums text-text">{fmtUsd(getValue())}</span>
      ),
    }),
    col.display({
      id: "weight",
      header: "Weight",
      cell: ({ row }) => <WeightBar actual={row.original.actualWeight} target={row.original.targetWeight} />,
    }),
    col.accessor("lastHarvest", {
      header: "Last Harvest",
      cell: ({ getValue }) => (
        <span className="font-mono text-xs text-text-muted">{moment(getValue()).fromNow()}</span>
      ),
    }),
    col.display({
      id: "fees",
      header: "Fees",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-text-muted">
          {fmtFeePct(row.original.depositFee)} in / {fmtFeePct(row.original.withdrawFee)} out
        </span>
      ),
    }),
  ];
}
