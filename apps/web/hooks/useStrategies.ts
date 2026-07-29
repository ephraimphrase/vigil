import { MOCK_STRATEGIES } from "../mocks/strategies.mock";
import type { StrategiesData } from "../types";

export function useStrategies(): StrategiesData {
  return MOCK_STRATEGIES;
}
