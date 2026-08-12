"use client";

// ─────────────────────────────────────────────────────────────
// usePortfolio — the connected wallet's real cross-vault position
// (/api/portfolio/[address], lib/ponder/mappers/portfolio.ts). One fetch:
// the route already does the Ponder cost-basis lookup and the live
// maxWithdraw reads server-side, so this hook is just useApi wired to the
// right url, gated on a connected account.
// ─────────────────────────────────────────────────────────────

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

// N on-chain reads per refresh (one per held vault) - refreshed less
// eagerly than a single vault's own page (useVault's 15s).
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
