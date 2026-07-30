import { useApi } from "./useApi";
import { MOCK_STRATEGIES } from "../mocks/strategies.mock";
import type { StrategiesData } from "../types";

export function useStrategies(): StrategiesData {
  return useApi("/api/strategies", MOCK_STRATEGIES);
}
