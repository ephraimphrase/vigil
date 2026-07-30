import { NextResponse } from "next/server";
import { getVault } from "@/seed";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = getVault(slug);
  if (!data) {
    return NextResponse.json({ error: `No vault matches "${slug}"` }, { status: 404 });
  }
  return NextResponse.json(data);
}
