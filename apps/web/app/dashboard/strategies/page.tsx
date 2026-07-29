"use client";


import type { ComponentType, ReactNode } from "react";
import { useStrategies } from "../../../hooks/useStrategies";
import { aggregate } from "../../../lib/rebalance";
import { StrategiesHeader } from "../../../components/StrategiesHeader";
import { StrategyCard } from "../../../components/StrategyCard";

type LinkLike = ComponentType<{ href: string; className?: string; children: ReactNode }>;

export default function StrategiesPage({ Link }: { Link?: LinkLike }) {
  const data = useStrategies();
  const agg = aggregate(data.strategies, data.vault);

  return (
    <div className="flex flex-col gap-4 p-4">
      <StrategiesHeader data={data} />

      {agg.needsAttention > 0 && (
        <div className="flex items-center gap-2 border-l-2 border-[#E0A95F] bg-panel/20 px-3 py-2">
          <span className="font-mono text-xs uppercase tracking-wider text-[#E0A95F]">
            {agg.needsAttention} {agg.needsAttention === 1 ? "strategy" : "strategies"} pending rebalance
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {data.strategies.map((s) => (
          <StrategyCard key={s.protocolId} strategy={s} Link={Link} />
        ))}
      </div>
    </div>
  );
}