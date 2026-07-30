import { pgTable, text, timestamp, serial } from "drizzle-orm/pg-core";

export const userTriggers = pgTable("user_triggers", {
  id: serial("id").primaryKey(),
  walletAddress: text("wallet_address").notNull(),
  protocol: text("protocol").notNull(),
  condition: text("condition").notNull(),
  actionSlug: text("action_slug").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull(),
});
