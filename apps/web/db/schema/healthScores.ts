import { pgTable, text, timestamp, doublePrecision } from "drizzle-orm/pg-core";

export const healthScores = pgTable("health_scores", {
  protocol: text("protocol").notNull(),
  timestamp: timestamp("timestamp", { mode: "date" }).notNull(),
  score: doublePrecision("score"),
  reasoning: text("reasoning"),
});
