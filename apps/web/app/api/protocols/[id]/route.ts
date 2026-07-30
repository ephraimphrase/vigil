import { NextResponse } from "next/server";

// Ids are lowercase-hyphenated (see mocks/protocol-detail/*.json filenames) -
// reject anything else before it ever reaches the dynamic import below.
const ID_PATTERN = /^[a-z0-9-]+$/;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!ID_PATTERN.test(id)) {
    return NextResponse.json({ error: `No protocol matches "${id}"` }, { status: 404 });
  }

  try {
    const mod = await import(`@/mocks/protocol-detail/${id}.json`);
    return NextResponse.json(mod.default);
  } catch {
    return NextResponse.json({ error: `No protocol matches "${id}"` }, { status: 404 });
  }
}
