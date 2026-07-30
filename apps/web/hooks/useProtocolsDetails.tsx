// ─────────────────────────────────────────────────────────────
// Data seam. Fetches one entity from /api/protocols/:id - no mock import
// here, so the raw dataset never ships in the client bundle.
// ─────────────────────────────────────────────────────────────

import { useApi } from "./useApi";
import type { ProtocolDetail } from "../types";

export function useProtocolDetail(id: string): ProtocolDetail | undefined {
  return useApi<ProtocolDetail | undefined>(`/api/protocols/${id}`, undefined);
}
