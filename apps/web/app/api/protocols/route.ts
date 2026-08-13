import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { protocols, healthScores } from "@/db/schema";

export async function GET() {
  const rows = await db.select().from(protocols);

  const scoreRows = await db
    .select({ protocol: healthScores.protocol, score: healthScores.score, timestamp: healthScores.timestamp })
    .from(healthScores)
    .orderBy(healthScores.protocol, desc(healthScores.timestamp));

  const historyByProtocol = new Map<string, number[]>();
  for (const r of scoreRows) {
    const list = historyByProtocol.get(r.protocol) ?? [];
    list.push(r.score ?? 0);
    historyByProtocol.set(r.protocol, list);
  }

  const list = rows.map(({ id, name, ticker, icon, assessment }) => {
    const [latest, prior] = historyByProtocol.get(id) ?? [];
    const score = latest ?? 0;
    const delta24h = latest !== undefined && prior !== undefined ? latest - prior : 0;
    return {
      id, name, ticker: ticker ?? "", icon: icon ?? "", score, delta24h,
      riskFlags: (assessment as { riskFlags?: string[] }).riskFlags ?? [],
    };
  });

  return NextResponse.json(list);
}
