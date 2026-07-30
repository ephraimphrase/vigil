import { pgTable, text, doublePrecision, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";

// A protocol can have more than one strategy variant (Curve alone has 9
// Convex/StakeDAO/Fx contracts), so `id` - not protocolId - is the
// primary key. No `score` column - a strategy's score IS its protocol's
// score (health_scores, keyed by protocolId), never a second copy that
// can drift from it. app/api/strategies/route.ts joins health_scores at
// read time instead of storing a duplicate here.
export const strategies = pgTable("strategies", {
  id: text("id").primaryKey(),
  protocolId: text("protocol_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  adapter: text("adapter").notNull(),
  strategyAddress: text("strategy_address").notNull(),
  stratName: text("strat_name").notNull(),
  native: text("native").notNull(),
  rewards: jsonb("rewards").notNull().$type<string[]>(),
  harvestOnDeposit: boolean("harvest_on_deposit").notNull(),
  asset: text("asset").notNull(),
  want: text("want").notNull(),
  allocated: doublePrecision("allocated").notNull(),
  targetWeight: doublePrecision("target_weight").notNull(),
  actualWeight: doublePrecision("actual_weight").notNull(),
  apy: doublePrecision("apy").notNull(),
  lastRebalance: timestamp("last_rebalance", { mode: "date" }).notNull(),
  paused: boolean("paused").notNull(),
  retired: boolean("retired").notNull(),
  lastHarvest: timestamp("last_harvest", { mode: "date" }).notNull(),
  harvestable: boolean("harvestable").notNull(),
  maxWithdraw: doublePrecision("max_withdraw").notNull(),
  maxDeposit: doublePrecision("max_deposit"),
  depositFee: doublePrecision("deposit_fee").notNull(),
  withdrawFee: doublePrecision("withdraw_fee").notNull(),
});
