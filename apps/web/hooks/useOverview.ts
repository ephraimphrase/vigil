

import { useEffect, useState } from "react";
import { MOCK_OVERVIEW } from "../mocks/overview.mock";
import type { FeedEvent, OverviewData } from "../types";

export function useOverview(): OverviewData {
  return MOCK_OVERVIEW;
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
