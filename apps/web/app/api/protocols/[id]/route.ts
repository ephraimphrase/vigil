import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { protocols, healthScores, triggers } from "@/db/schema";

function bandFor(score: number): string {
  return score >= 80 ? "hold" : score >= 60 ? "reduce_25" : score >= 40 ? "reduce_50" : "exit";
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [row] = await db.select().from(protocols).where(eq(protocols.id, id));
  if (!row) {
    return NextResponse.json({ error: `No protocol matches "${id}"` }, { status: 404 });
  }
  const {
    name, ticker, icon, aliases, category, chain, settlementLayer, kind, description, launchDate,
    links, market, assessment, assessmentHistory, signals, risk, contracts, incidents,
    dependencies, askSuggestions,
  } = row;

  // health_scores gets a row every ~15 min (KeeperHub's ingest sweep) - a
  // plain `.limit(14)` on raw rows is 14 rows of the same day, not 14
  // days. One row per calendar day so this stays a real daily trend, and
  // delta24h/delta7d below (which index into this same array) stay correct.
  const dayHistory = await db.execute<{ timestamp: string; score: number | null }>(sql`
    SELECT DISTINCT ON (date_trunc('day', timestamp)) timestamp, score
    FROM health_scores
    WHERE protocol = ${id}
    ORDER BY date_trunc('day', timestamp) DESC, timestamp DESC
    LIMIT 14
  `);
  const history = dayHistory.rows
    .map((h) => ({ timestamp: new Date(h.timestamp), score: h.score ?? 0 }))
    .reverse();
  const scoreHistory = history.map((h, i) => {
    const window = history.slice(Math.max(0, i - 1), i + 1);
    const avg24h = Math.round(window.reduce((s, w) => s + w.score, 0) / window.length);
    return { ts: h.timestamp.toISOString().slice(0, 10), score: h.score, avg24h };
  });

  const latest = history[history.length - 1];
  const prior24h = history[history.length - 2];
  const prior7d = history[Math.max(0, history.length - 8)];
  const score = latest?.score ?? 0;
  const delta24h = latest && prior24h ? latest.score - prior24h.score : 0;
  const delta7d = latest && prior7d ? latest.score - prior7d.score : 0;

  const triggerRows = await db
    .select({ timestamp: triggers.timestamp, action: triggers.action, reason: triggers.reason })
    .from(triggers)
    .where(eq(triggers.protocol, id))
    .orderBy(desc(triggers.timestamp))
    .limit(10);

  return NextResponse.json({
    identity: {
      id: row.id, name, ticker, icon, aliases, category, chain, settlementLayer,
      kind, description, launchDate,
      ageDays: Math.round((Date.now() - Date.parse(launchDate)) / 86400000),
      links,
    },
    health: { score, band: bandFor(score), delta24h, delta7d, assessment, assessmentHistory },
    market,
    scoreHistory,
    signals,
    risk,
    triggers: triggerRows.map((t) => ({
      ts: t.timestamp, score, delta: delta7d, action: t.action, reason: t.reason,
    })),
    contracts,
    incidents,
    dependencies,
    askSuggestions,
  });
}
