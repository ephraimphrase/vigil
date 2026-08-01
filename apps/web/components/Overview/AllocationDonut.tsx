import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { fmtUsd } from "@/shared/format";
import type { Position } from "../types";

const SLICE = ["#9259DA", "#B58AE6", "#6E4E9E", "#8065B0", "#55416E", "#9F95AB"];

export function AllocationDonut({ positions, total }: { positions: Position[]; total: number }) {
  const data = positions.map((p) => ({ name: p.name, value: p.allocated }));
  return (
    <div className="relative h-40 w-40 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={52} outerRadius={70} paddingAngle={2} stroke="none">
            {data.map((_, i) => <Cell key={i} fill={SLICE[i % SLICE.length]} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-sm tabular-nums text-body">{fmtUsd(total)}</span>
        <span className="font-mono text-xs uppercase tracking-wider text-muted/60">deployed</span>
      </div>
    </div>
  );
}
