import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const triggers = pgTable("triggers", {
  protocol: text("protocol").notNull(),
  timestamp: timestamp("timestamp", { mode: "date" }).notNull(),
  action: text("action"),
  reason: text("reason"),
  txHash: text("tx_hash"),
});
