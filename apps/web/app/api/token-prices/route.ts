import { NextResponse } from "next/server";
import { getTokenPrices } from "@/lib/tokenPrices";

export async function GET() {
  try {
    return NextResponse.json(await getTokenPrices());
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to load token prices" }, { status: 502 });
  }
}
