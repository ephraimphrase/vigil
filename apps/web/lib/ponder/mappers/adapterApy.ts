import type { AdaptersQuery } from "@/lib/ponder/generated/sdk";

type PonderAdapter = AdaptersQuery["adapters"]["items"][number];

// Matches MockStrategyAdapter.sol's own apyBps/BPS_DIVISOR convention
// (apyBps: 500 = 5.00% annualized) - divide by 100 to land on the same
// plain-percent numbers VaultsColumns/VaultMasthead already format.
const BPS_DIVISOR = 100;

// Allocation-weighted across a vault's adapters. Retired adapters are
// excluded rather than trusted to already carry a zero `allocated` -
// VigilVault evacuates a retiring adapter's funds first (removeAdapter/
// emergencyEvacuate in VigilVault.sol), so they should read as zero, but
// this doesn't depend on that holding exactly.
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
