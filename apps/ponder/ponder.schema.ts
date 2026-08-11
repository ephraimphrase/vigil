import { onchainEnum, onchainTable } from "ponder";

// Solidity's IVigilVault.VaultKind has a third value (Basket=2), but it's
// unused - no vault has ever been created with it and none is expected to
// be, so it's deliberately left out here. If that ever changes, the insert
// in src/index.ts will throw (VAULT_KIND_LABELS[2] is undefined) rather
// than silently accepting bad data - a real Basket vault would need this
// enum extended back to 3 values first.
export const vaultKind = onchainEnum("vault_kind", ["Single", "LP"]);

// One row per vault, written once when VaultFactory emits VaultCreated -
// vault address as the primary key since VaultFactory enforces exactly
// one vault per asset, but the vault's own address is still the more
// natural unique id to key rows by.
export const vault = onchainTable("vault", (t) => ({
  id: t.hex().primaryKey(),
  asset: t.hex().notNull(),
  oracle: t.hex().notNull(),
  kind: vaultKind("kind").notNull(),
  // VaultCreated itself doesn't carry any of this - VigilVault is its own
  // ERC20 (name/symbol) and the underlying asset is a separate ERC20 with
  // its own metadata, so both get read on-chain once at index time rather
  // than left as bare addresses.
  vaultName: t.text().notNull(),
  vaultSymbol: t.text().notNull(),
  assetName: t.text().notNull(),
  assetSymbol: t.text().notNull(),
  assetDecimals: t.integer().notNull(),
  createdAtBlock: t.bigint().notNull(),
  createdAtTimestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}));

// Live state, not an append-only log - one row per adapter, upserted on
// every adapter event. Field names mirror what apps/web's strategy view
// (types/strategies.ts) actually reads from IVigilProtocolAdapter: paused,
// retired, allocated (totalAssets), lastHarvestAt/lastHarvestGain. Static
// fields (protocolId, stratName, apyBps) are read once when the row is
// first created from AdapterAdded; the rest gets refreshed via a live
// totalAssets()/paused()/retired() read on every subsequent adapter event,
// rather than derived by replaying event math, so it can't drift.
export const adapter = onchainTable("adapter", (t) => ({
  id: t.hex().primaryKey(),
  vault: t.hex().notNull(),
  protocolId: t.hex().notNull(),
  stratName: t.text().notNull(),
  apyBps: t.bigint().notNull(),
  allocated: t.bigint().notNull(),
  paused: t.boolean().notNull(),
  retired: t.boolean().notNull(),
  lastHarvestAt: t.bigint(),
  lastHarvestGain: t.bigint(),
  addedAtBlock: t.bigint().notNull(),
  addedAtTimestamp: t.bigint().notNull(),
}));

// Every table below is keyed by "{txHash}-{logIndex}" - a single
// transaction can emit the same event type more than once (e.g. batching),
// so the log's own position is what's actually unique, not the tx hash
// alone.

export const deposit = onchainTable("deposit", (t) => ({
  id: t.text().primaryKey(),
  vault: t.hex().notNull(),
  sender: t.hex().notNull(),
  owner: t.hex().notNull(),
  assets: t.bigint().notNull(),
  shares: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}));

export const withdrawal = onchainTable("withdrawal", (t) => ({
  id: t.text().primaryKey(),
  vault: t.hex().notNull(),
  sender: t.hex().notNull(),
  receiver: t.hex().notNull(),
  owner: t.hex().notNull(),
  assets: t.bigint().notNull(),
  shares: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}));

export const adapterAdded = onchainTable("adapter_added", (t) => ({
  id: t.text().primaryKey(),
  vault: t.hex().notNull(),
  adapter: t.hex().notNull(),
  protocolId: t.hex().notNull(),
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}));

export const adapterRemoved = onchainTable("adapter_removed", (t) => ({
  id: t.text().primaryKey(),
  vault: t.hex().notNull(),
  adapter: t.hex().notNull(),
  protocolId: t.hex().notNull(),
  withdrawn: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}));

export const rebalance = onchainTable("rebalance", (t) => ({
  id: t.text().primaryKey(),
  vault: t.hex().notNull(),
  totalPool: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}));

export const adapterEvacuated = onchainTable("adapter_evacuated", (t) => ({
  id: t.text().primaryKey(),
  vault: t.hex().notNull(),
  adapter: t.hex().notNull(),
  withdrawn: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}));

export const protocolRegistered = onchainTable("protocol_registered", (t) => ({
  id: t.text().primaryKey(),
  protocolId: t.hex().notNull(),
  initialScore: t.integer().notNull(),
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}));

export const scoreUpdated = onchainTable("score_updated", (t) => ({
  id: t.text().primaryKey(),
  protocolId: t.hex().notNull(),
  oldScore: t.integer().notNull(),
  newScore: t.integer().notNull(),
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}));

export const emergencyZeroed = onchainTable("emergency_zeroed", (t) => ({
  id: t.text().primaryKey(),
  protocolId: t.hex().notNull(),
  previousScore: t.integer().notNull(),
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}));

export const adapterDeposited = onchainTable("adapter_deposited", (t) => ({
  id: t.text().primaryKey(),
  adapter: t.hex().notNull(),
  requested: t.bigint().notNull(),
  supplied: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}));

export const adapterWithdrawn = onchainTable("adapter_withdrawn", (t) => ({
  id: t.text().primaryKey(),
  adapter: t.hex().notNull(),
  requested: t.bigint().notNull(),
  received: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}));

export const adapterHarvested = onchainTable("adapter_harvested", (t) => ({
  id: t.text().primaryKey(),
  adapter: t.hex().notNull(),
  gain: t.bigint().notNull(),
  totalAssetsAfter: t.bigint().notNull(),
  blockNumber: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}));

export const adapterRetiredEvent = onchainTable(
  "adapter_retired_event",
  (t) => ({
    id: t.text().primaryKey(),
    adapter: t.hex().notNull(),
    withdrawn: t.bigint().notNull(),
    blockNumber: t.bigint().notNull(),
    timestamp: t.bigint().notNull(),
    txHash: t.hex().notNull(),
  }),
);
