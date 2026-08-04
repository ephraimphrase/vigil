

import { useEffect, useRef, useState } from "react";
import { useApi, type ApiResult } from "./useApi";
import type { FeedEvent, OverviewData } from "../types";

const EMPTY: OverviewData = {
  status: { state: "paused", watchedCount: 0, lastCycle: "" },
  portfolio: { totalValue: 0, shares: 0, sharePrice: 0, pnl24h: 0, pnlPct24h: 0, benchmarkDeltaPct: 0 },
  positions: [],
  events: [],
  pendingApprovals: 0,
};

export function useOverview(): ApiResult<OverviewData> {
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
  // `initial` starts as [] while useOverview's fetch is in flight, then
  // becomes the real seed events once it resolves - but this component
  // never remounts between those two renders, so useState's initial value
  // alone would miss the real data. Sync exactly once, the first time
  // `initial` actually has something in it; never again after, so it
  // can't wipe out synthetic events the interval below has appended since.
  const seeded = useRef(initial.length > 0);
  useEffect(() => {
    if (!seeded.current && initial.length > 0) {
      seeded.current = true;
      setEvents(initial);
    }
  }, [initial]);

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      const s = SAMPLE[i % SAMPLE.length];
      i += 1;
      if (!s) return;
      setEvents((prev) =>
        [{ ...s, id: `live-${Date.now()}`, ts: new Date().toISOString() }, ...prev].slice(0, max)
      );
    }, 7000);
    return () => clearInterval(t);
  }, [max]);
  return events;
}
