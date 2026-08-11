import { onchainTable } from "ponder";

// One row per vault, written once when VaultFactory emits VaultCreated -
// vault address as the primary key since VaultFactory enforces exactly
// one vault per asset, but the vault's own address is still the more
// natural unique id to key rows by.
export const vault = onchainTable("vault", (t) => ({
  id: t.hex().primaryKey(),
  asset: t.hex().notNull(),
  oracle: t.hex().notNull(),
  kind: t.integer().notNull(),
  createdAtBlock: t.bigint().notNull(),
  createdAtTimestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
}));
