"use client";

// ─────────────────────────────────────────────────────────────
// VaultPerformanceChart — the Performance tab. Sub-tabbed (30-Day APY /
// Performance / TVL) over the vault's own history series, same
// hairline-grid/violet-line recharts styling as ScoreChart.tsx.
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/EmptyState";
import { dateShort, fmtUsd } from "@/shared/format";
import type { VaultHistoryPoint } from "@/types";

const HAIRLINE = "rgba(202,192,213,0.2)";
const VIOLET = "#9259DA";
const MUTED = "#9F95AB";

type Metric = "apy30d" | "performance" | "tvl";

const METRIC_TABS: { id: Metric; label: string }[] = [
  { id: "apy30d", label: "30-Day APY" },
  { id: "performance", label: "Performance" },
  { id: "tvl", label: "TVL" },
];

function formatMetric(metric: Metric, v: number): string {
  return metric === "tvl" ? fmtUsd(v) : `${v.toFixed(2)}%`;
}

function ChartTooltip({ active, payload, metric }: { active?: boolean; payload?: { payload: VaultHistoryPoint & { label: string } }[]; metric: Metric }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]!.payload;
  return (
    <div className="rounded-none border border-hairline bg-panel px-3 py-2 font-mono text-xs">
      <div className="text-muted">{p.label}</div>
      <div className="text-body">{formatMetric(metric, p[metric])}</div>
    </div>
  );
}

export function VaultPerformanceChart({ history }: { history: VaultHistoryPoint[] }) {
  const [metric, setMetric] = useState<Metric>("apy30d");

  if (history.length === 0) {
    return <EmptyState query="" label="history" message="No performance history yet." />;
  }

  const data = history.map((h) => ({ ...h, label: dateShort(h.ts) }));
  const values = data.map((d) => d[metric]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * 0.15 || Math.max(max * 0.1, 1);

  return (
    <div className="flex flex-col gap-3">
      <Tabs tabs={METRIC_TABS} active={metric} onChange={setMetric} />
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid stroke={HAIRLINE} strokeDasharray="0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontFamily: "monospace", fontSize: 10, fill: MUTED }}
              axisLine={{ stroke: HAIRLINE }}
              tickLine={false}
              minTickGap={30}
            />
            <YAxis
              domain={[Math.max(0, min - pad), max + pad]}
              tick={{ fontFamily: "monospace", fontSize: 10, fill: MUTED }}
              axisLine={false}
              tickLine={false}
              width={52}
              tickFormatter={(v: number) => formatMetric(metric, v)}
            />
            <Tooltip content={<ChartTooltip metric={metric} />} cursor={{ stroke: HAIRLINE }} />
            <Line type="monotone" dataKey={metric} stroke={VIOLET} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
