import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { fmtUsd, fmtPct } from "@/shared/format";

export interface AllocationSlice {
  name: string;
  valueUsd: number;
}

const MAX_SLICES = 8;
const SLICE_COLORS = [
  "#B58AE6", // light lavender
  "#9259DA", // primary violet
  "#7C3AED", // deep violet
  "#8065B0", // muted violet
  "#6E4E9E", // dark violet
  "#5B4B8A", // violet-blue transition
  "#4C6FD6", // blue-violet
  "#3B82F6", // blue
];
const OTHERS_COLOR = "#9F95AB"; // neutral - reads as "everything else", not a 9th category

interface DonutSlice {
  name: string;
  value: number;
  fill: string;
}

function buildSlices(allocations: AllocationSlice[]): DonutSlice[] {
  const sorted = allocations.filter((a) => a.valueUsd > 0).sort((a, b) => b.valueUsd - a.valueUsd);
  const top = sorted.slice(0, MAX_SLICES).map((a, i) => ({ name: a.name, value: a.valueUsd, fill: SLICE_COLORS[i]! }));
  const othersValue = sorted.slice(MAX_SLICES).reduce((sum, a) => sum + a.valueUsd, 0);
  return othersValue > 0 ? [...top, { name: "Others", value: othersValue, fill: OTHERS_COLOR }] : top;
}

export function AllocationDonut({ allocations, total }: { allocations: AllocationSlice[]; total: number }) {
  const slices = buildSlices(allocations);

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={slices} dataKey="value" innerRadius={52} outerRadius={70} paddingAngle={2} stroke="none">
              {slices.map((s) => <Cell key={s.name} fill={s.fill} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-sm tabular-nums text-body">{fmtUsd(total)}</span>
          <span className="font-mono text-xs uppercase tracking-wider text-muted/60">deployed</span>
        </div>
      </div>

      {slices.length > 0 && (
        <ul className="flex flex-col gap-1">
          {slices.map((s) => (
            <li key={s.name} className="flex items-center gap-1.5 font-mono text-xs">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: s.fill }} />
              <span className="max-w-[7rem] truncate text-muted">{s.name}</span>
              <span className="text-muted/50">{total > 0 ? fmtPct(s.value / total) : "0%"}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
