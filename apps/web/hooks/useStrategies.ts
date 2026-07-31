import { useApi, type ApiResult } from "./useApi";
import type { StrategiesData } from "../types";

const EMPTY: StrategiesData = { strategies: [] };

export function useStrategies(): ApiResult<StrategiesData> {
  return useApi("/api/strategies", EMPTY);
}
