import { useApi, type ApiResult } from "./useApi";
import type { ProtocolDetail } from "../types";

export function useProtocolDetail(id: string): ApiResult<ProtocolDetail | undefined> {
  return useApi<ProtocolDetail | undefined>(`/api/protocols/${id}`, undefined);
}
