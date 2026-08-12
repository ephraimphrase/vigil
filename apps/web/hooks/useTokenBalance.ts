"use client";

import { useActiveAccount, useWalletBalance } from "thirdweb/react";
import { thirdwebClient } from "@/lib/thirdweb-client";
import { chainForId } from "@/lib/chains";

const VAULT_CHAIN_ID = "84532";

export function useTokenBalance(tokenAddress: string | undefined): {
  balance: number | null;
  isLoading: boolean;
  connected: boolean;
  refetch: () => void;
} {
  const account = useActiveAccount();

  const { data, isLoading, refetch } = useWalletBalance(
    {
      client: thirdwebClient!,
      chain: chainForId(VAULT_CHAIN_ID),
      address: account?.address,
      tokenAddress,
    },
    { enabled: !!account && !!tokenAddress },
  );

  return {
    balance: data ? Number(data.displayValue) : null,
    isLoading,
    connected: !!account,
    refetch,
  };
}
