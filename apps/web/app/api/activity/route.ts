import { NextResponse } from "next/server";
import { ponder } from "@/lib/ponder/client";
import { buildVaultsById } from "@/lib/ponder/mappers/vaultMeta";
import { buildAdaptersById } from "@/lib/ponder/mappers/vaultActivity";
import {
  toScoreUpdatedActivity,
  toProtocolRegisteredActivity,
  toEmergencyZeroedActivity,
  toRebalanceActivity,
  toAdapterAddedActivity,
  toAdapterRemovedActivity,
  toAdapterEvacuatedActivity,
  toAdapterRetiredActivity,
  toAdapterHarvestedActivity,
} from "@/lib/ponder/mappers/vaultActivity";
import { getTokenPrices, type PriceByAddress } from "@/lib/tokenPrices";

const LIMIT = 500;
const RECENT_FIRST = { limit: LIMIT, orderBy: "timestamp", orderDirection: "desc" } as const;

export const dynamic = "force-dynamic";

export async function GET() {
  const [
    { vaults },
    { adapters },
    { scoreUpdateds },
    { protocolRegistereds },
    { emergencyZeroeds },
    { rebalances },
    { adapterAddeds },
    { adapterRemoveds },
    { adapterEvacuateds },
    { adapterRetiredEvents },
    { adapterHarvesteds },
    prices,
  ] = await Promise.all([
    ponder.Vaults({ limit: 1000 }),
    ponder.Adapters({ limit: 1000 }),
    ponder.ScoreUpdateds(RECENT_FIRST),
    ponder.ProtocolRegistereds(RECENT_FIRST),
    ponder.EmergencyZeroeds(RECENT_FIRST),
    ponder.Rebalances(RECENT_FIRST),
    ponder.AdapterAddeds(RECENT_FIRST),
    ponder.AdapterRemoveds(RECENT_FIRST),
    ponder.AdapterEvacuateds(RECENT_FIRST),
    ponder.AdapterRetiredEvents(RECENT_FIRST),
    ponder.AdapterHarvesteds(RECENT_FIRST),
    // Pricing is best-effort - a CoinGecko hiccup should degrade amounts to
    // token units (amountLabel's own fallback), not fail the whole feed.
    getTokenPrices().catch((): PriceByAddress => ({})),
  ]);

  const vaultsById = buildVaultsById(vaults.items);
  const adaptersById = buildAdaptersById(adapters.items);

  const entries = [
    ...scoreUpdateds.items.map(toScoreUpdatedActivity),
    ...protocolRegistereds.items.map(toProtocolRegisteredActivity),
    ...emergencyZeroeds.items.map(toEmergencyZeroedActivity),
    ...rebalances.items.map((e) => toRebalanceActivity(e, vaultsById, prices)),
    ...adapterAddeds.items.map((e) => toAdapterAddedActivity(e, vaultsById, adaptersById)),
    ...adapterRemoveds.items.map((e) => toAdapterRemovedActivity(e, vaultsById, adaptersById, prices)),
    ...adapterEvacuateds.items.map((e) => toAdapterEvacuatedActivity(e, vaultsById, adaptersById, prices)),
    ...adapterRetiredEvents.items.map((e) => toAdapterRetiredActivity(e, vaultsById, adaptersById, prices)),
    ...adapterHarvesteds.items.map((e) => toAdapterHarvestedActivity(e, vaultsById, adaptersById, prices)),
  ].sort((a, b) => b.ts.localeCompare(a.ts));

  return NextResponse.json({ entries });
}
