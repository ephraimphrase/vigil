// ─────────────────────────────────────────────────────────────
// Data seam. Selects one entity from the mock by id. Swap the import
// (or the body) for a hook / server fetch later — the page is unchanged.
// ─────────────────────────────────────────────────────────────

import { useApi } from "./useApi";
import doc from "../mocks/protocol-detail.json";
import type { ProtocolDetail, ProtocolDetailDoc } from "../types";

const DOC = doc as unknown as ProtocolDetailDoc;

export function useProtocolDetail(id: string): ProtocolDetail | undefined {
  const fallback = DOC.protocols.find((p) => p.identity.id === id);
  return useApi(`/api/protocols/${id}`, fallback);
}

export function listProtocolIds(): string[] {
  return DOC.protocols.map((p) => p.identity.id);
}