import { NextResponse } from "next/server";
import { MOCK_VAULT } from "@/mocks/vault.mock";

export function GET() {
  return NextResponse.json(MOCK_VAULT);
}
