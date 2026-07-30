import { NextResponse } from "next/server";
import { MOCK_STRATEGIES } from "@/mocks/strategies.mock";

export function GET() {
  return NextResponse.json(MOCK_STRATEGIES);
}
