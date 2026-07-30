
import {
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ReferenceDot,
  } from "recharts";
  import { Section } from "./Section";
  import { dateShort } from "@/shared/format";
  import { bandColor } from "@/shared/health";
  import type { ScorePoint } from "../types";
  
  const HAIRLINE = "rgba(202,192,213,0.2)";
  const VIOLET = "#9259DA";
  const MUTED = "#9F95AB";

  function ChartTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload as ScorePoint & { label: string };
    return (
      <div className="rounded-none border border-hairline bg-panel px-3 py-2 font-mono text-xs">
        <div className="text-muted">{p.label}</div>
        <div className="text-body">score {p.score}</div>
        <div className="text-muted/70">avg {p.avg24h}</div>
        {p.trigger && <div className="mt-1" style={{ color: bandColor(p.score) }}>{p.trigger.action}</div>}
      </div>
    );
  }
  
   export function ScoreChart({ history }: { history: ScorePoint[] }) {
    const data = history.map((h) => ({ ...h, label: dateShort(h.ts) }));
    const min = Math.min(...data.map((d) => Math.min(d.score, d.avg24h)));
    const yMin = Math.max(0, Math.floor((min - 5) / 10) * 10);
    const triggers = data.filter((d) => d.trigger);
  
    return (
      <Section title="Score history">
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid stroke={HAIRLINE} strokeDasharray="0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontFamily: "monospace", fontSize: 10, fill: MUTED }}
                     axisLine={{ stroke: HAIRLINE }} tickLine={false} minTickGap={20} />
              <YAxis domain={[yMin, 100]} tick={{ fontFamily: "monospace", fontSize: 10, fill: MUTED }}
                     axisLine={false} tickLine={false} width={40} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: HAIRLINE }} />
              <Line type="monotone" dataKey="avg24h" stroke={MUTED} strokeWidth={1}
                    strokeDasharray="3 3" dot={false} />
              <Line type="monotone" dataKey="score" stroke={VIOLET} strokeWidth={2} dot={false} />
              {triggers.map((t, i) => (
                <ReferenceDot key={i} x={t.label} y={t.score} r={4}
                              fill={bandColor(t.score)} stroke="none" />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center gap-4 font-mono text-xs text-muted">
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-4" style={{ background: VIOLET }} /> score</span>
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 border-t border-dashed" style={{ borderColor: MUTED }} /> 24h avg</span>
          {triggers.length > 0 && <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: "#E0A95F" }} /> trigger</span>}
        </div>
      </Section>
    );
  }