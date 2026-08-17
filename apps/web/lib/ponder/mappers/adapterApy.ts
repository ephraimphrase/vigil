import type { AdaptersQuery } from "@/lib/ponder/generated/sdk";

type PonderAdapter = AdaptersQuery["adapters"]["items"][number];

const BPS_DIVISOR = 100;

export function weightedApy(adapters: PonderAdapter[]): number {
  const live = adapters.filter((a) => !a.retired);

  let totalAllocated = 0;
  let weightedBps = 0;
  for (const a of live) {
    const allocated = Number(a.allocated);
    totalAllocated += allocated;
    weightedBps += Number(a.apyBps) * allocated;
  }

  return totalAllocated > 0 ? weightedBps / totalAllocated / BPS_DIVISOR : 0;
}
