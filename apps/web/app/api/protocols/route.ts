import { NextResponse } from "next/server";
import { MOCK_PROTOCOLS } from "@/mocks/protocols";

export function GET() {
  return NextResponse.json(MOCK_PROTOCOLS);
}
