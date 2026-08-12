import type {
  AdaptersQuery,
  AdapterAddedsQuery,
  AdapterEvacuatedsQuery,
  AdapterHarvestedsQuery,
  AdapterRemovedsQuery,
  AdapterRetiredEventsQuery,
  EmergencyZeroedsQuery,
  ProtocolRegisteredsQuery,
  RebalancesQuery,
  ScoreUpdatedsQuery,
} from "@/lib/ponder/generated/sdk";
import type { PriceByAddress } from "@/lib/tokenPrices";
import type { ActivityEntry } from "@/types";
import { vaultMeta, toAmount, amountUsd, type PonderVault } from "./vaultMeta";
import { decodeProtocolName } from "./protocolName";

type PonderAdapter = AdaptersQuery["adapters"]["items"][number];
type PonderScoreUpdated = ScoreUpdatedsQuery["scoreUpdateds"]["items"][number];
type PonderProtocolRegistered = ProtocolRegisteredsQuery["protocolRegistereds"]["items"][number];
type PonderEmergencyZeroed = EmergencyZeroedsQuery["emergencyZeroeds"]["items"][number];
type PonderRebalance = RebalancesQuery["rebalances"]["items"][number];
type PonderAdapterAdded = AdapterAddedsQuery["adapterAddeds"]["items"][number];
type PonderAdapterRemoved = AdapterRemovedsQuery["adapterRemoveds"]["items"][number];
type PonderAdapterEvacuated = AdapterEvacuatedsQuery["adapterEvacuateds"]["items"][number];
type PonderAdapterRetired = AdapterRetiredEventsQuery["adapterRetiredEvents"]["items"][number];
type PonderAdapterHarvested = AdapterHarvestedsQuery["adapterHarvesteds"]["items"][number];

const iso = (timestamp: string) => new Date(Number(timestamp) * 1000).toISOString();

export function buildAdaptersById(adapters: PonderAdapter[]): Map<string, PonderAdapter> {
  return new Map(adapters.map((a) => [a.id.toLowerCase(), a]));
}

// adapterEvacuated/adapterRetiredEvent/adapterHarvested only carry the
// adapter's address, not its stratName or (for retired/harvested) even
// its vault - both live on the adapter's own current entity record, which
// still exists (with retired: true) after removal, same as the Strategies
// tab already relies on.
function adapterMeta(adaptersById: Map<string, PonderAdapter>, adapterAddress: string) {
  const a = adaptersById.get(adapterAddress.toLowerCase());
  return {
    stratName: a?.stratName ?? (a ? decodeProtocolName(a.protocolId) : adapterAddress),
    vault: a?.vault,
  };
}

function amountLabel(raw: string, decimals: number, symbol: string, assetAddress: string | undefined, prices: PriceByAddress): string {
  const amount = toAmount(raw, decimals);
  const usd = amountUsd(amount, assetAddress, prices);
  return usd != null
    ? `$${usd.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
    : `${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${symbol}`;
}

export function toScoreUpdatedActivity(e: PonderScoreUpdated): ActivityEntry {
  const name = decodeProtocolName(e.protocolId);
  return {
    id: `score-updated-${e.id}`,
    ts: iso(e.timestamp),
    kind: "score",
    protocolId: name,
    message: `${name} health score updated: ${e.oldScore} → ${e.newScore}`,
    score: e.newScore,
    delta: e.newScore - e.oldScore,
    txHash: e.txHash,
  };
}

export function toProtocolRegisteredActivity(e: PonderProtocolRegistered): ActivityEntry {
  const name = decodeProtocolName(e.protocolId);
  return {
    id: `protocol-registered-${e.id}`,
    ts: iso(e.timestamp),
    kind: "score",
    protocolId: name,
    message: `${name} registered with an initial health score of ${e.initialScore}`,
    score: e.initialScore,
    txHash: e.txHash,
  };
}

export function toEmergencyZeroedActivity(e: PonderEmergencyZeroed): ActivityEntry {
  const name = decodeProtocolName(e.protocolId);
  return {
    id: `emergency-zeroed-${e.id}`,
    ts: iso(e.timestamp),
    kind: "circuit_breaker",
    protocolId: name,
    message: `${name} health score emergency-zeroed (was ${e.previousScore})`,
    score: 0,
    circuitBreakerReason:
      "A guardian forced this protocol's score to 0, overriding the oracle - treated as an immediate exit signal until a human reviews it.",
    txHash: e.txHash,
  };
}

export function toRebalanceActivity(e: PonderRebalance, vaultsById: Map<string, PonderVault>, prices: PriceByAddress): ActivityEntry {
  const { vaultName, asset, decimals, assetAddress } = vaultMeta(vaultsById, e.vault);
  return {
    id: `rebalance-${e.id}`,
    ts: iso(e.timestamp),
    kind: "execution",
    protocolId: vaultName,
    message: `${vaultName} rebalanced — pool now ${amountLabel(e.totalPool, decimals, asset, assetAddress, prices)}`,
    action: "rebalance",
    txHash: e.txHash,
  };
}

export function toAdapterAddedActivity(
  e: PonderAdapterAdded,
  vaultsById: Map<string, PonderVault>,
  adaptersById: Map<string, PonderAdapter>,
): ActivityEntry {
  const { vaultName } = vaultMeta(vaultsById, e.vault);
  const { stratName } = adapterMeta(adaptersById, e.adapter);
  return {
    id: `adapter-added-${e.id}`,
    ts: iso(e.timestamp),
    kind: "strategy_added",
    protocolId: vaultName,
    message: `${vaultName} added ${stratName} as a new strategy`,
    txHash: e.txHash,
  };
}

export function toAdapterRemovedActivity(
  e: PonderAdapterRemoved,
  vaultsById: Map<string, PonderVault>,
  adaptersById: Map<string, PonderAdapter>,
  prices: PriceByAddress,
): ActivityEntry {
  const { vaultName, asset, decimals, assetAddress } = vaultMeta(vaultsById, e.vault);
  const { stratName } = adapterMeta(adaptersById, e.adapter);
  return {
    id: `adapter-removed-${e.id}`,
    ts: iso(e.timestamp),
    kind: "strategy_removed",
    protocolId: vaultName,
    message: `${vaultName} removed ${stratName} — ${amountLabel(e.withdrawn, decimals, asset, assetAddress, prices)} returned to idle`,
    txHash: e.txHash,
  };
}

export function toAdapterEvacuatedActivity(
  e: PonderAdapterEvacuated,
  vaultsById: Map<string, PonderVault>,
  adaptersById: Map<string, PonderAdapter>,
  prices: PriceByAddress,
): ActivityEntry {
  const { vaultName, asset, decimals, assetAddress } = vaultMeta(vaultsById, e.vault);
  const { stratName } = adapterMeta(adaptersById, e.adapter);
  return {
    id: `adapter-evacuated-${e.id}`,
    ts: iso(e.timestamp),
    kind: "circuit_breaker",
    protocolId: vaultName,
    message: `${vaultName}: ${stratName} emergency-evacuated — ${amountLabel(e.withdrawn, decimals, asset, assetAddress, prices)} pulled out immediately`,
    circuitBreakerReason:
      "A guardian pulled funds out of this strategy right away, without waiting for a scheduled rebalance - used when a protocol needs to be exited immediately.",
    txHash: e.txHash,
  };
}

export function toAdapterRetiredActivity(
  e: PonderAdapterRetired,
  vaultsById: Map<string, PonderVault>,
  adaptersById: Map<string, PonderAdapter>,
  prices: PriceByAddress,
): ActivityEntry {
  const { stratName, vault } = adapterMeta(adaptersById, e.adapter);
  const { vaultName, asset, decimals, assetAddress } = vaultMeta(vaultsById, vault ?? "");
  return {
    id: `adapter-retired-${e.id}`,
    ts: iso(e.timestamp),
    kind: "strategy_removed",
    protocolId: vaultName,
    message: `${stratName} retired from ${vaultName} — ${amountLabel(e.withdrawn, decimals, asset, assetAddress, prices)} withdrawn`,
    txHash: e.txHash,
  };
}

export function toAdapterHarvestedActivity(
  e: PonderAdapterHarvested,
  vaultsById: Map<string, PonderVault>,
  adaptersById: Map<string, PonderAdapter>,
  prices: PriceByAddress,
): ActivityEntry {
  const { stratName, vault } = adapterMeta(adaptersById, e.adapter);
  const { vaultName, asset, decimals, assetAddress } = vaultMeta(vaultsById, vault ?? "");
  const gain = BigInt(e.gain);
  const message =
    gain > 0n
      ? `${stratName} (${vaultName}) harvested ${amountLabel(e.gain, decimals, asset, assetAddress, prices)} in yield`
      : `${stratName} (${vaultName}) harvested — no gain this cycle`;
  return {
    id: `adapter-harvested-${e.id}`,
    ts: iso(e.timestamp),
    kind: "harvest",
    protocolId: vaultName,
    message,
    txHash: e.txHash,
  };
}
