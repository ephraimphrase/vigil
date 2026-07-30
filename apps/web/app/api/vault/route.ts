import { NextResponse } from "next/server";
import { SEED } from "@/seed";

export function GET() {
  return NextResponse.json(SEED.vault);
}
