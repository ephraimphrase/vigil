"use client";

// ─────────────────────────────────────────────────────────────
// useDepositableTokens — testTokens.ts accumulates every token ever
// deployed across every redeploy; this cross-references it against
// /api/vaults' own asset addresses so callers only ever see tokens you can
// actually go deposit somewhere with (never a vault's own share token,
// which isn't in testTokens.ts to begin with). Shared by FaucetModal and
// the wallet pages so the two can't drift into showing different lists.
// ─────────────────────────────────────────────────────────────

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
