import { pgTable, text, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";

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
  // CoinGecko coin id apps/api/ingestion/market.py polls (e.g.
  // "compound-governance-token", not "compound"). Null falls back to
  // using the protocol id itself, since that already matches CoinGecko
  // for some protocols.
  coingeckoId: text("coingecko_id"),
  // DeFiLlama slug(s) apps/api/ingestion/tvl.py polls (e.g.
  // ["compound-finance"], not "compound"). More than one sums their TVL
  // together, for protocols split across multiple DeFiLlama entries
  // (e.g. Velodrome's v2/v3). Null falls back to using the protocol id
  // itself as the sole slug.
  defillamaSlug: jsonb("defillama_slug").$type<string[] | null>(),
  // True for protocols whose DeFiLlama /protocol/{slug} response is too
  // large to fetch in time - those use the fast /tvl/{slug} endpoint
  // instead and skip 24h/7d delta calculation.
  defillamaUseFastEndpoint: boolean("defillama_use_fast_endpoint").notNull(),
  // ERC20 token contract apps/api/ingestion/whales.py (and liquidations.py)
  // query via Alchemy's Transfers/Logs APIs. Null for protocols with no
  // token tracked yet.
  whaleTokenAddress: text("whale_token_address"),
  // LunarCrush ticker symbol apps/api/ingestion/social.py polls (e.g. "AAVE").
  lunarcrushSymbol: text("lunarcrush_symbol"),
  // Subreddits apps/api/ingestion/sentiment.py searches for mentions (e.g.
  // ["Aave", "defi"]). Null falls back to searching just ["defi"].
  sentimentSubreddits: jsonb("sentiment_subreddits").$type<string[] | null>(),
  // Snapshot.org governance space ENS name(s) apps/api/ingestion/snapshot.py
  // polls (e.g. ["aavedao.eth"]) - more than one queries all of them
  // together in a single call, for protocols governed across multiple
  // spaces.
  snapshotSpace: jsonb("snapshot_space").$type<string[] | null>(),
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
