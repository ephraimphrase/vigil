import { NextResponse } from "next/server";
import { ponder } from "@/lib/ponder/client";
import { toVaultData } from "@/lib/ponder/mappers/vaultData";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { vault } = await ponder.Vault({ id: slug.toLowerCase() });
  if (!vault) {
    return NextResponse.json({ error: `No vault matches "${slug}"` }, { status: 404 });
  }
  return NextResponse.json(toVaultData(vault));
}
