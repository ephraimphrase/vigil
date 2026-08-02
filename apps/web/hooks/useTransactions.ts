import { useApi, type ApiResult } from "./useApi";
import type { TransactionsData } from "../types";

const EMPTY: TransactionsData = { entries: [] };

export function useTransactions(): ApiResult<TransactionsData> {
  return useApi("/api/transactions", EMPTY);
}
