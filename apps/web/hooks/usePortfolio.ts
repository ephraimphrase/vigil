"use client";

import { useActiveAccount } from "thirdweb/react";
import { useApi, type ApiResult } from "./useApi";
import type { PortfolioSummaryData } from "../types";

const EMPTY: PortfolioSummaryData = {
  totalValueUsd: 0,
  pnlUsd: 0,
  vaultsCount: 0,
  currentApy: 0,
  apy30d: null,
  positions: [],
};

const REFETCH_INTERVAL_MS = 60_000;

export function usePortfolio(): ApiResult<PortfolioSummaryData> & { connected: boolean } {
  const account = useActiveAccount();
  const result = useApi<PortfolioSummaryData>(
    `/api/portfolio/${account?.address ?? ""}`,
    EMPTY,
    REFETCH_INTERVAL_MS,
    !!account,
  );
  return { ...result, connected: !!account };
}
