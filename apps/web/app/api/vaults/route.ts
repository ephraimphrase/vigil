import { NextResponse } from "next/server";
import { ponder } from "@/lib/ponder/client";
import { toVaultSummary } from "@/lib/ponder/mappers/vaultSummary";

export async function GET() {
  const { vaults } = await ponder.Vaults({ limit: 1000 });
  return NextResponse.json(vaults.items.map(toVaultSummary));
}
