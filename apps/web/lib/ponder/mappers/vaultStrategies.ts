import { toTokens } from "thirdweb";
import type { AdaptersQuery } from "@/lib/ponder/generated/sdk";
import type { VaultStrategyRow } from "@/types";

type PonderAdapter = AdaptersQuery["adapters"]["items"][number];

const BPS_DIVISOR = 100;

// One row per adapter this vault has ever added (active, paused, or
// retired) - a full history, not just what's currently live, since
// "what strategies has this vault used" is the point of the tab.
export function toVaultStrategies(adapters: PonderAdapter[], decimals: number, priceUsd: number | null): VaultStrategyRow[] {
  return adapters
    .map((a): VaultStrategyRow => {
      const allocated = Number(toTokens(BigInt(a.allocated), decimals));
      const lastHarvestGain = a.lastHarvestGain != null ? Number(toTokens(BigInt(a.lastHarvestGain), decimals)) : null;
      return {
        id: a.id,
        protocolId: a.protocolId,
        stratName: a.stratName,
        apy: Number(a.apyBps) / BPS_DIVISOR,
        allocated,
        allocatedUsd: priceUsd != null ? allocated * priceUsd : null,
        paused: a.paused,
        retired: a.retired,
        lastHarvestAt: a.lastHarvestAt != null ? new Date(Number(a.lastHarvestAt) * 1000).toISOString() : null,
        lastHarvestGainUsd: lastHarvestGain != null && priceUsd != null ? lastHarvestGain * priceUsd : null,
      };
    })
    .sort((a, b) => b.allocated - a.allocated);
}
