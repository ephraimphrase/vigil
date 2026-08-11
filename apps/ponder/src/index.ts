import { ponder } from "ponder:registry";
import { erc20Abi } from "viem";

import { StrategyAdapterAbi } from "../abis/StrategyAdapterAbi";
import { VigilVaultAbi } from "../abis/VigilVaultAbi";
import {
  adapter,
  adapterAdded,
  adapterDeposited,
  adapterEvacuated,
  adapterHarvested,
  adapterRemoved,
  adapterRetiredEvent,
  adapterWithdrawn,
  deposit,
  emergencyZeroed,
  protocolRegistered,
  rebalance,
  scoreUpdated,
  vault,
  withdrawal,
} from "../ponder.schema";

// Matches IVigilVault.VaultKind's declaration order (Single=0, LP=1) -
// VaultCreated only emits the raw uint8 index. Solidity's enum also has a
// third value, Basket=2, but it's unused (see ponder.schema.ts's vaultKind)
// - a Basket vault would make this lookup return undefined and throw below,
// on purpose, rather than silently inserting bad data.
const VAULT_KIND_LABELS = ["Single", "LP"] as const;

// Every event table shares this same envelope. A single transaction can
// emit the same event type more than once, so the log's own position (not
// the tx hash alone) is what makes `id` unique.
function eventMeta(event: {
  block: { number: bigint; timestamp: bigint };
  transaction: { hash: `0x${string}` };
  log: { logIndex: number };
}) {
  return {
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    blockNumber: event.block.number,
    timestamp: event.block.timestamp,
    txHash: event.transaction.hash,
  };
}

ponder.on("VaultFactory:VaultCreated", async ({ event, context }) => {
  const [vaultName, vaultSymbol, assetName, assetSymbol, assetDecimals] =
    await context.client.multicall({
      contracts: [
        { address: event.args.vault, abi: VigilVaultAbi, functionName: "name" },
        {
          address: event.args.vault,
          abi: VigilVaultAbi,
          functionName: "symbol",
        },
        { address: event.args.asset, abi: erc20Abi, functionName: "name" },
        { address: event.args.asset, abi: erc20Abi, functionName: "symbol" },
        { address: event.args.asset, abi: erc20Abi, functionName: "decimals" },
      ],
      allowFailure: false,
    });

  await context.db.insert(vault).values({
    ...eventMeta(event),
    id: event.args.vault,
    asset: event.args.asset,
    oracle: event.args.oracle,
    kind: VAULT_KIND_LABELS[event.args.kind]!,
    vaultName,
    vaultSymbol,
    assetName,
    assetSymbol,
    assetDecimals,
    createdAtBlock: event.block.number,
    createdAtTimestamp: event.block.timestamp,
  });
});

ponder.on("VigilVault:Deposit", async ({ event, context }) => {
  await context.db.insert(deposit).values({
    ...eventMeta(event),
    vault: event.log.address,
    sender: event.args.sender,
    owner: event.args.owner,
    assets: event.args.assets,
    shares: event.args.shares,
  });
});

ponder.on("VigilVault:Withdraw", async ({ event, context }) => {
  await context.db.insert(withdrawal).values({
    ...eventMeta(event),
    vault: event.log.address,
    sender: event.args.sender,
    receiver: event.args.receiver,
    owner: event.args.owner,
    assets: event.args.assets,
    shares: event.args.shares,
  });
});

ponder.on("VigilVault:AdapterAdded", async ({ event, context }) => {
  await context.db.insert(adapterAdded).values({
    ...eventMeta(event),
    vault: event.log.address,
    adapter: event.args.adapter,
    protocolId: event.args.protocolId,
  });

  const [stratName, apyBps, allocated, paused, retired] =
    await context.client.multicall({
      contracts: [
        {
          address: event.args.adapter,
          abi: StrategyAdapterAbi,
          functionName: "stratName",
        },
        {
          address: event.args.adapter,
          abi: StrategyAdapterAbi,
          functionName: "apyBps",
        },
        {
          address: event.args.adapter,
          abi: StrategyAdapterAbi,
          functionName: "totalAssets",
        },
        {
          address: event.args.adapter,
          abi: StrategyAdapterAbi,
          functionName: "paused",
        },
        {
          address: event.args.adapter,
          abi: StrategyAdapterAbi,
          functionName: "retired",
        },
      ],
      allowFailure: false,
    });
  const adapterFields = {
    vault: event.log.address,
    protocolId: event.args.protocolId,
    stratName,
    apyBps,
    allocated,
    paused,
    retired,
  };

  await context.db
    .insert(adapter)
    .values({
      id: event.args.adapter,
      ...adapterFields,
      addedAtBlock: event.block.number,
      addedAtTimestamp: event.block.timestamp,
    })
    .onConflictDoUpdate(adapterFields);
});

ponder.on("VigilVault:AdapterRemoved", async ({ event, context }) => {
  await context.db.insert(adapterRemoved).values({
    ...eventMeta(event),
    vault: event.log.address,
    adapter: event.args.adapter,
    protocolId: event.args.protocolId,
    withdrawn: event.args.withdrawn,
  });
});

ponder.on("VigilVault:Rebalanced", async ({ event, context }) => {
  await context.db.insert(rebalance).values({
    ...eventMeta(event),
    vault: event.log.address,
    totalPool: event.args.totalPool,
  });
});

ponder.on("VigilVault:AdapterEvacuated", async ({ event, context }) => {
  await context.db.insert(adapterEvacuated).values({
    ...eventMeta(event),
    vault: event.log.address,
    adapter: event.args.adapter,
    withdrawn: event.args.withdrawn,
  });
});

ponder.on("HealthOracle:ProtocolRegistered", async ({ event, context }) => {
  await context.db.insert(protocolRegistered).values({
    ...eventMeta(event),
    protocolId: event.args.protocolId,
    initialScore: event.args.initialScore,
  });
});

ponder.on("HealthOracle:ScoreUpdated", async ({ event, context }) => {
  await context.db.insert(scoreUpdated).values({
    ...eventMeta(event),
    protocolId: event.args.protocolId,
    oldScore: event.args.oldScore,
    newScore: event.args.newScore,
  });
});

ponder.on("HealthOracle:EmergencyZeroed", async ({ event, context }) => {
  await context.db.insert(emergencyZeroed).values({
    ...eventMeta(event),
    protocolId: event.args.protocolId,
    previousScore: event.args.previousScore,
  });
});

// Both Deposited and Withdrawn need the same "refresh adapter state from a
// live read" step afterward (drift-proof vs. replaying event math), so it's
// pulled into a shared function rather than duplicated. Takes only the
// adapter address plus client/db directly (not the full per-event-name
// `event`/`context` objects) since those two events' `args` shapes differ
// (Deposited has `supplied`, Withdrawn has `received`) and this function
// never touches `args` anyway.
async function refreshAdapterState(
  adapterAddress: `0x${string}`,
  context: Parameters<
    Parameters<typeof ponder.on<"StrategyAdapter:Deposited">>[1]
  >[0]["context"],
) {
  const [allocated, paused, retired] = await context.client.multicall({
    contracts: [
      {
        address: adapterAddress,
        abi: StrategyAdapterAbi,
        functionName: "totalAssets",
      },
      {
        address: adapterAddress,
        abi: StrategyAdapterAbi,
        functionName: "paused",
      },
      {
        address: adapterAddress,
        abi: StrategyAdapterAbi,
        functionName: "retired",
      },
    ],
    allowFailure: false,
  });
  await context.db
    .update(adapter, { id: adapterAddress })
    .set({ allocated, paused, retired });
}

ponder.on("StrategyAdapter:Deposited", async ({ event, context }) => {
  await context.db.insert(adapterDeposited).values({
    ...eventMeta(event),
    adapter: event.log.address,
    requested: event.args.requested,
    supplied: event.args.supplied,
  });
  await refreshAdapterState(event.log.address, context);
});

ponder.on("StrategyAdapter:Withdrawn", async ({ event, context }) => {
  await context.db.insert(adapterWithdrawn).values({
    ...eventMeta(event),
    adapter: event.log.address,
    requested: event.args.requested,
    received: event.args.received,
  });
  await refreshAdapterState(event.log.address, context);
});

ponder.on("StrategyAdapter:Harvested", async ({ event, context }) => {
  await context.db.insert(adapterHarvested).values({
    ...eventMeta(event),
    adapter: event.log.address,
    gain: event.args.gain,
    totalAssetsAfter: event.args.totalAssetsAfter,
  });
  await context.db.update(adapter, { id: event.log.address }).set({
    allocated: event.args.totalAssetsAfter,
    lastHarvestAt: event.block.timestamp,
    lastHarvestGain: event.args.gain,
  });
});

ponder.on("StrategyAdapter:Retired", async ({ event, context }) => {
  await context.db.insert(adapterRetiredEvent).values({
    ...eventMeta(event),
    adapter: event.log.address,
    withdrawn: event.args.withdrawn,
  });
  await context.db
    .update(adapter, { id: event.log.address })
    .set({ retired: true, allocated: 0n });
});
