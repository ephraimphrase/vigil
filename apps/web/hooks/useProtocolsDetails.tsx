// ─────────────────────────────────────────────────────────────
// Data seam. Selects one entity from the mock by id. Swap the import
// (or the body) for a hook / server fetch later — the page is unchanged.
// ─────────────────────────────────────────────────────────────

import doc from "../mocks/protocol-detail.json";
import type { ProtocolDetail, ProtocolDetailDoc } from "../types";

const DOC = doc as unknown as ProtocolDetailDoc;

export function useProtocolDetail(id: string): ProtocolDetail | undefined {
  return DOC.protocols.find((p) => p.identity.id === id);
}

export function listProtocolIds(): string[] {
  return DOC.protocols.map((p) => p.identity.id);
}