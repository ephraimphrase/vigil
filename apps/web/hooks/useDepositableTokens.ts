"use client";

import { useMemo } from "react";
import { useApi } from "@/hooks/useApi";
import { testTokens, type TestToken } from "@/lib/testTokens";
import type { VaultSummary } from "@/types";

const FAUCET_CHAIN_ID = "84532";
const ALL_TOKENS: TestToken[] = testTokens[FAUCET_CHAIN_ID] ?? [];

export function useDepositableTokens(): { tokens: TestToken[]; isLoading: boolean } {
  const { data: vaults, isLoading } = useApi<VaultSummary[]>("/api/vaults", []);

  const tokens = useMemo(() => {
    const liveAssets = new Set(vaults.map((v) => v.tokenContractAddress.toLowerCase()));
    return ALL_TOKENS.filter((t) => liveAssets.has(t.address.toLowerCase()));
  }, [vaults]);

  return { tokens, isLoading };
}
