import { useApi } from "./useApi";
import type { StrategiesData } from "../types";

const EMPTY: StrategiesData = { strategies: [] };

export function useStrategies(): StrategiesData {
  return useApi("/api/strategies", EMPTY);
}
