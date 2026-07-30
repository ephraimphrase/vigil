import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { strategies } from "@/db/schema";

export async function GET() {
  const rows = await db.select().from(strategies);

  const list = rows.map((row) => ({
    ...row,
    lastRebalance: row.lastRebalance.toISOString(),
    lastHarvest: row.lastHarvest.toISOString(),
  }));

  return NextResponse.json({ strategies: list });
}
