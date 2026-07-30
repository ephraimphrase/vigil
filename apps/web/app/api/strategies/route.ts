import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { strategies, healthScores } from "@/db/schema";

export async function GET() {
  const rows = await db.select().from(strategies);

  const scoreRows = await db
    .selectDistinctOn([healthScores.protocol], {
      protocol: healthScores.protocol,
      score: healthScores.score,
    })
    .from(healthScores)
    .orderBy(healthScores.protocol, desc(healthScores.timestamp));
  const latestScore = new Map(scoreRows.map((r) => [r.protocol, r.score ?? 0]));

  const list = rows.map((row) => ({
    ...row,
    score: latestScore.get(row.protocolId) ?? 0,
    lastRebalance: row.lastRebalance.toISOString(),
    lastHarvest: row.lastHarvest.toISOString(),
  }));

  return NextResponse.json({ strategies: list });
}
