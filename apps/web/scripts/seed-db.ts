// ─────────────────────────────────────────────────────────────
// Seeds the shared Postgres DB. `protocols` table + 14 days of
// health_scores per protocol are what app/api/protocols/[id]/route.ts
// actually queries - this script is the only place that data comes from.
// Run with: pnpm seed:db
// ─────────────────────────────────────────────────────────────

import "dotenv/config";
import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { protocols, healthScores, triggers, strategies } from "../db/schema";
import { SEED } from "../seed";
import { PROTOCOL_SEEDS, type ProtocolSeed } from "./protocol-seed-data";
import aave from "../seed/protocol-detail/aave.json";
import base from "../seed/protocol-detail/base.json";
import lido from "../seed/protocol-detail/lido.json";
import sky from "../seed/protocol-detail/sky.json";
import uniswap from "../seed/protocol-detail/uniswap.json";

const EXISTING = [aave, base, lido, sky, uniswap];

function bandFor(score: number): string {
  return score >= 80 ? "hold" : score >= 60 ? "reduce_25" : score >= 40 ? "reduce_50" : "exit";
}

// Deterministic 14-day walk ending at `endScore`, small day-to-day noise
// driven by the string itself (not Math.random) so re-running the seed
// produces the same history rather than a new one every time.
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

function toProtocolDetail(p: ProtocolSeed, icon: string) {
  const score = SEED.protocols.find((x) => x.id === p.id)?.score ?? 75;
  const delta24h = SEED.protocols.find((x) => x.id === p.id)?.delta24h ?? 0;
  return {
    identity: {
      id: p.id, name: p.name, ticker: p.ticker, aliases: p.aliases,
      category: p.category, chain: p.chain, settlementLayer: p.settlementLayer,
      kind: p.kind, description: p.description, launchDate: p.launchDate,
      ageDays: Math.round((Date.parse("2026-07-30") - Date.parse(p.launchDate)) / 86400000),
      links: { ...p.links, icon },
    },
    health: {
      score, band: bandFor(score), delta24h, delta7d: delta24h * 3,
      assessment: { summary: p.assessmentSummary, riskFlags: p.riskFlags, confidence: p.confidence, updatedAt: "2026-07-30" },
      assessmentHistory: [],
    },
    market: p.market,
    scoreHistory: [], // served from health_scores at query time, not stored here
    signals: p.signals,
    risk: p.risk,
    triggers: [],
    contracts: p.contracts,
    incidents: p.incidents,
    dependencies: p.dependencies,
    askSuggestions: p.askSuggestions,
  };
}

function protocolRow(
  identity: { id: string; name: string; ticker: string | null; aliases: string[]; category: string; chain: string; settlementLayer: string | null; kind: string; description: string; launchDate: string; links: Record<string, unknown> },
  health: { assessment: Record<string, unknown>; assessmentHistory: unknown[] },
  market: Record<string, unknown> | null,
  signals: Record<string, unknown>,
  risk: unknown[],
  contracts: unknown[],
  incidents: unknown[],
  dependencies: unknown[],
  askSuggestions: string[],
  icon: string | null
) {
  return {
    id: identity.id, name: identity.name, ticker: identity.ticker, icon,
    aliases: identity.aliases, category: identity.category, chain: identity.chain,
    settlementLayer: identity.settlementLayer, kind: identity.kind, description: identity.description,
    launchDate: identity.launchDate, links: identity.links, market,
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

  // Existing 5, already in full ProtocolDetail shape - insert as-is.
  for (const detail of EXISTING) {
    const meta = SEED.protocols.find((p) => p.id === detail.identity.id);
    await upsertProtocol(db, protocolRow(
      detail.identity, detail.health, detail.market ?? null, detail.signals,
      detail.risk, detail.contracts, detail.incidents, detail.dependencies,
      detail.askSuggestions, meta?.icon ?? null
    ));
    console.log(`seeded protocols (existing): ${detail.identity.id}`);
  }

  // 17 new ones, built from the compact seed shape.
  for (const p of PROTOCOL_SEEDS) {
    const meta = SEED.protocols.find((x) => x.id === p.id);
    const d = toProtocolDetail(p, meta?.icon ?? "");
    await upsertProtocol(db, protocolRow(
      d.identity, d.health, d.market ?? null, d.signals,
      d.risk, d.contracts, d.incidents, d.dependencies,
      d.askSuggestions, meta?.icon ?? null
    ));
    console.log(`seeded protocols (new): ${d.identity.id}`);
  }

  // 14 days of health_scores per protocol, so score history charts have
  // real data instead of a single "now" point.
  const allIds = [...EXISTING.map((d) => d.identity.id), ...PROTOCOL_SEEDS.map((p) => p.id)];
  for (const id of allIds) {
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
    const { protocolId, ...set } = {
      protocolId: s.protocolId, name: s.name, category: s.category, description: s.description,
      adapter: s.adapter, strategyAddress: s.strategyAddress, stratName: s.stratName, native: s.native,
      rewards: s.rewards, harvestOnDeposit: s.harvestOnDeposit, asset: s.asset, want: s.want,
      allocated: s.allocated, targetWeight: s.targetWeight, actualWeight: s.actualWeight,
      score: s.score, apy: s.apy, lastRebalance: new Date(s.lastRebalance), paused: s.paused,
      retired: s.retired, lastHarvest: new Date(s.lastHarvest), harvestable: s.harvestable,
      maxWithdraw: s.maxWithdraw, maxDeposit: s.maxDeposit, depositFee: s.depositFee,
      withdrawFee: s.withdrawFee,
    };
    await db
      .insert(strategies)
      .values({ protocolId, ...set })
      .onConflictDoUpdate({ target: strategies.protocolId, set });
    console.log(`seeded strategies: ${protocolId}`);
  }

  await pool.end();
  console.log("done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
