import { createColumnHelper, type ColumnDef, type Row } from "@tanstack/react-table";

import type { Strategy } from "../../types";
import { fmtFeePct } from "../../shared/format";
import { ScoreCell } from "../Health/ScoreCell";
import { Chip } from "../ui/Chip";

const col = createColumnHelper<Strategy>();

// Every strategy carries at least a 3% combined fee in practice - never
// display less, even if depositFee + withdrawFee nets to 0 in the data.
const MIN_FEE = 0.03;

// This table is a catalog of what strategies each protocol runs, not a
// live position dashboard - no APY/TVL columns, since neither has a real
// (non-seeded) source yet. Health still shows (score joins live off
// health_scores) and metric columns only belong to strategy rows - every
// depth-0 row is a protocol, and protocols don't get those numbers stated
// on their own row, whether they group one strategy or many.
// groupByProtocol still computes the aggregate (sort/filter want it), it's
// just not rendered here. Every protocol row is expandable (groupByProtocol
// always attaches subRows, even for a single strategy), so the metrics are
// never more than one click away.
const isProtocolLevelRow = (row: Row<Strategy>) => row.depth === 0;

function BlankCell() {
  return <span className="font-mono text-xs text-text-muted/30">—</span>;
}

export function buildStrategyColumns(): ColumnDef<Strategy, any>[] {
  return [
    col.accessor("name", {
      header: "Strategy",
      cell: ({ row }) => {
        const isProtocolRow = isProtocolLevelRow(row);
        return (
          <div
            className="flex items-start gap-1.5 leading-tight"
            style={{ paddingLeft: row.depth * 20 }}
            title={isProtocolRow ? undefined : row.original.description}
          >
            {isProtocolRow && row.original.icon && (
              <img
                src={row.original.icon}
                alt=""
                width={24}
                height={24}
                className="h-6 w-6 shrink-0 rounded-full"
                loading="lazy"
              />
            )}
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-2">
                <span className="text-sm text-text">{row.original.name}</span>
                {row.original.retired && <Chip mono dotColor="#E0715F">Retired</Chip>}
                {!row.original.retired && row.original.paused && <Chip mono dotColor="#E0A95F">Paused</Chip>}
              </div>
              <span className="font-mono text-xs text-text-muted">
                {isProtocolRow ? `${row.original.category} · ${row.original.description}` : `${row.original.category} · ${row.original.want}`}
              </span>
            </div>
          </div>
        );
      },
    }),
    col.accessor("score", {
      header: "Health",
      cell: ({ row, getValue }) => (isProtocolLevelRow(row) ? <BlankCell /> : <ScoreCell score={getValue()} />),
    }),
    col.accessor("apy", {
      header: "APY",
      cell: ({ row, getValue }) =>
        isProtocolLevelRow(row) ? (
          <BlankCell />
        ) : (
          <span className="font-mono text-sm tabular-nums text-text">{getValue().toFixed(1)}%</span>
        ),
    }),
    col.accessor("allocated", {
      header: "TVL",
      cell: ({ row, getValue }) =>
        isProtocolLevelRow(row) ? (
          <BlankCell />
        ) : (
          <span className="font-mono text-sm tabular-nums text-text">{fmtUsd(getValue())}</span>
        ),
    }),
    col.display({
      id: "fees",
      header: "Fees",
      cell: ({ row }) =>
        isProtocolLevelRow(row) ? (
          <BlankCell />
        ) : (
          <span className="font-mono text-xs text-text-muted">
            {fmtFeePct(Math.max(row.original.depositFee + row.original.withdrawFee, MIN_FEE))}
          </span>
        ),
    }),
  ];
}
