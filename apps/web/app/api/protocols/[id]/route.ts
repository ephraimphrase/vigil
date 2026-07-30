import { NextResponse } from "next/server";
import doc from "@/mocks/protocol-detail.json";
import type { ProtocolDetailDoc } from "@/types";

const DOC = doc as unknown as ProtocolDetailDoc;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const protocol = DOC.protocols.find((p) => p.identity.id === id);
  if (!protocol) {
    return NextResponse.json({ error: `No protocol matches "${id}"` }, { status: 404 });
  }
  return NextResponse.json(protocol);
}
