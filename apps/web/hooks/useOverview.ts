

import { useEffect, useState } from "react";
import { useApi } from "./useApi";
import type { FeedEvent, OverviewData } from "../types";

const EMPTY: OverviewData = {
  status: { state: "paused", watchedCount: 0, lastCycle: "" },
  portfolio: { totalValue: 0, shares: 0, sharePrice: 0, pnl24h: 0, pnlPct24h: 0, benchmarkDeltaPct: 0 },
  positions: [],
  events: [],
  pendingApprovals: 0,
};

export function useOverview(): OverviewData {
  return useApi("/api/overview", EMPTY);
}

const SAMPLE: Omit<FeedEvent, "id" | "ts">[] = [
  { kind: "score", protocolId: "lido", message: "Lido health updated", score: 83 },
  { kind: "score", protocolId: "uniswap", message: "Uniswap health updated", score: 88 },
  { kind: "cycle", message: "Polling cycle complete — 5 protocols scored" },
  { kind: "score", protocolId: "sky", message: "Sky health updated", score: 81 },
];

export function useEventStream(initial: FeedEvent[], max = 40): FeedEvent[] {
  const [events, setEvents] = useState<FeedEvent[]>(initial);
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      const s = SAMPLE[i % SAMPLE.length];
      i += 1;
      setEvents((prev) =>
        [{ ...s, id: `live-${Date.now()}`, ts: new Date().toISOString() }, ...prev].slice(0, max)
      );
    }, 7000);
    return () => clearInterval(t);
  }, [max]);
  return events;
}
