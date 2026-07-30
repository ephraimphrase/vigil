import { NextResponse } from "next/server";
import protocols from "@/mocks/protocols.json";

export function GET() {
  return NextResponse.json(protocols);
}
