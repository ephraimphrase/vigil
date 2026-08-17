import { createColumnHelper, type ColumnDef, type Row } from "@tanstack/react-table";

import type { Strategy } from "../../types";
import { fmtFeePct } from "../../shared/format";
import { ScoreCell } from "../Health/ScoreCell";
import { Chip } from "../ui/Chip";

const col = createColumnHelper<Strategy>();

const MIN_FEE = 0.03;

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
