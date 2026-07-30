import { NextResponse } from "next/server";
import { MOCK_OVERVIEW } from "@/mocks/overview.mock";

export function GET() {
  return NextResponse.json(MOCK_OVERVIEW);
}
