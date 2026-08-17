import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { protocols, healthScores, triggers, strategies } from "../db/schema";
import { SEED } from "../seed";

const detailDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../seed/protocol-detail");
const PROTOCOL_DETAILS = fs
  .readdirSync(detailDir)
  .filter((f) => f.endsWith(".json") && f !== "_meta.json")
  .map((f) => JSON.parse(fs.readFileSync(path.join(detailDir, f), "utf8")));

function scoreWalk(id: string, endScore: number): { score: number; ts: string }[] {
  let seed = [...id].reduce((s, c) => s + c.charCodeAt(0), 0);
  const next = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return (seed % 5) - 2; // -2..+2
  };
  const reversed: number[] = [endScore];
  for (let i = 1; i < 14; i++) {
    const prev = reversed[i - 1] ?? endScore;
    reversed.push(Math.max(0, Math.min(100, prev - next())));
  }
  const scores = reversed.slice().reverse();
  const today = new Date("2026-07-30T00:00:00Z");
  return scores.map((score, i) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - (13 - i));
    return { score, ts: d.toISOString() };
  });
}

function protocolRow(detail: (typeof PROTOCOL_DETAILS)[number], icon: string | null) {
  const { identity, health, market, signals, risk, contracts, incidents, dependencies, askSuggestions } = detail;
  return {
    id: identity.id, name: identity.name, ticker: identity.ticker, icon,
    aliases: identity.aliases, category: identity.category, chain: identity.chain,
    settlementLayer: identity.settlementLayer, kind: identity.kind, description: identity.description,
    launchDate: identity.launchDate, links: identity.links, market: market ?? null,
    githubRepo: identity.githubRepo ?? null,
    coingeckoId: identity.coingeckoId ?? null,
    defillamaSlug: identity.defillamaSlug ?? null,
    defillamaUseFastEndpoint: identity.defillamaUseFastEndpoint ?? false,
    whaleTokenAddress: identity.whaleTokenAddress ?? null,
    lunarcrushSymbol: identity.lunarcrushSymbol ?? null,
    sentimentSubreddits: identity.sentimentSubreddits ?? null,
    snapshotSpace: identity.snapshotSpace ?? null,
    typedSignalCatalog: identity.typedSignalCatalog ?? null,
    assessment: health.assessment, assessmentHistory: health.assessmentHistory,
    signals, risk, contracts, incidents, dependencies, askSuggestions,
    updatedAt: new Date(),
  };
}

async function upsertProtocol(db: NodePgDatabase, row: ReturnType<typeof protocolRow>) {
  const { id, ...set } = row;
  await db.insert(protocols).values(row).onConflictDoUpdate({ target: protocols.id, set });
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  for (const detail of PROTOCOL_DETAILS) {
    const meta = SEED.protocols.find((p) => p.id === detail.identity.id);
    await upsertProtocol(db, protocolRow(detail, meta?.icon ?? null));
    console.log(`seeded protocols: ${detail.identity.id}`);
  }

  for (const detail of PROTOCOL_DETAILS) {
    const id = detail.identity.id;
    const endScore = SEED.protocols.find((p) => p.id === id)?.score ?? 75;
    const walk = scoreWalk(id, endScore);
    await db.insert(healthScores).values(
      walk.map((point) => ({
        protocol: id, timestamp: new Date(point.ts), score: point.score, reasoning: "seeded history",
      }))
    );
    console.log(`seeded health_scores history: ${id} (14 points)`);
  }

  for (const e of SEED.overview.events) {
    if (e.kind !== "execution" || !e.protocolId) continue;
    await db.insert(triggers).values({
      protocol: e.protocolId, timestamp: new Date(), action: e.action ?? "unknown",
      reason: e.message, txHash: e.txHash ?? null,
    });
    console.log(`seeded triggers: ${e.protocolId} (${e.action})`);
  }

  for (const s of SEED.strategies.strategies) {
    const { id, ...set } = {
      id: s.id, protocolId: s.protocolId, name: s.name, category: s.category, description: s.description,
      adapter: s.adapter, strategyAddress: s.strategyAddress, stratName: s.stratName, native: s.native,
      rewards: s.rewards, harvestOnDeposit: s.harvestOnDeposit, asset: s.asset, want: s.want,
      allocated: s.allocated, targetWeight: s.targetWeight, actualWeight: s.actualWeight,
      apy: s.apy, lastRebalance: new Date(s.lastRebalance), paused: s.paused,
      retired: s.retired, lastHarvest: new Date(s.lastHarvest), harvestable: s.harvestable,
      maxWithdraw: s.maxWithdraw, maxDeposit: s.maxDeposit, depositFee: s.depositFee,
      withdrawFee: s.withdrawFee,
    };
    await db
      .insert(strategies)
      .values({ id, ...set })
      .onConflictDoUpdate({ target: strategies.id, set });
    console.log(`seeded strategies: ${id}`);
  }

  await pool.end();
  console.log("done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
