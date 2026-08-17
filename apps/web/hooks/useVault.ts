import { useApi, type ApiResult } from "./useApi";
import type { VaultData } from "../types";

const REFETCH_INTERVAL_MS = 15_000;

export function useVault(slug: string, address?: string): ApiResult<VaultData | undefined> {
  const url = `/api/vault/${slug}${address ? `?address=${address}` : ""}`;
  return useApi<VaultData | undefined>(url, undefined, REFETCH_INTERVAL_MS);
}
