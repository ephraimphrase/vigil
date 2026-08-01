import { useApi, type ApiResult } from "./useApi";
import type { ActivityData } from "../types";

const EMPTY: ActivityData = { entries: [] };

export function useActivity(): ApiResult<ActivityData> {
  return useApi("/api/activity", EMPTY);
}
