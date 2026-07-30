import { NextResponse } from "next/server";
import strategies from "@/mocks/strategies.json";

export function GET() {
  return NextResponse.json(strategies);
}
