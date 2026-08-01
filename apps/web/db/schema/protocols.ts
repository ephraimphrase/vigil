import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const protocols = pgTable("protocols", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ticker: text("ticker"),
  icon: text("icon"),
  aliases: jsonb("aliases").notNull().$type<string[]>(),
  category: text("category").notNull(),
  chain: text("chain").notNull(),
  settlementLayer: text("settlement_layer"),
  kind: text("kind").notNull(),
  description: text("description").notNull(),
  launchDate: text("launch_date").notNull(),
  // "org/repo" slug apps/api/ingestion/github.py polls for commit/release
  // signals (e.g. "aave/aave-v3-core") - distinct from links.github, which
  // is just the org's github.com page. Null for protocols with no repo
  // tracked yet.
  githubRepo: text("github_repo"),
  links: jsonb("links").notNull().$type<Record<string, unknown>>(),
  market: jsonb("market").$type<Record<string, unknown> | null>(),
  assessment: jsonb("assessment").notNull().$type<Record<string, unknown>>(),
  assessmentHistory: jsonb("assessment_history").notNull().$type<unknown[]>(),
  signals: jsonb("signals").notNull().$type<Record<string, unknown>>(),
  risk: jsonb("risk").notNull().$type<unknown[]>(),
  contracts: jsonb("contracts").notNull().$type<unknown[]>(),
  incidents: jsonb("incidents").notNull().$type<unknown[]>(),
  dependencies: jsonb("dependencies").notNull().$type<unknown[]>(),
  askSuggestions: jsonb("ask_suggestions").notNull().$type<string[]>(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull(),
});
