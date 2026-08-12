"use client";

import { getContract, toTokens } from "thirdweb";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import { thirdwebClient } from "@/lib/thirdweb-client";
import { chainForId } from "@/lib/chains";

const VAULT_CHAIN_ID = "84532";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export function useVaultWithdrawable(
  vaultAddress: string | undefined,
  tokenAddress: string | undefined,
): {
  balance: number | null;
  isLoading: boolean;
  connected: boolean;
  refetch: () => void;
} {
  const account = useActiveAccount();
  const chain = chainForId(VAULT_CHAIN_ID);
  const enabled = !!account && !!vaultAddress && !!tokenAddress;

  const vault = getContract({ client: thirdwebClient!, chain, address: vaultAddress ?? ZERO_ADDRESS });
  const token = getContract({ client: thirdwebClient!, chain, address: tokenAddress ?? ZERO_ADDRESS });

  const { data: decimals } = useReadContract({
    contract: token,
    method: "function decimals() view returns (uint8)",
    params: [],
    queryOptions: { enabled },
  });

  const { data: assets, isLoading, refetch } = useReadContract({
    contract: vault,
    method: "function maxWithdraw(address owner) view returns (uint256)",
    params: [account?.address ?? ZERO_ADDRESS],
    queryOptions: { enabled },
  });

  return {
    balance: assets != null && decimals != null ? Number(toTokens(assets, decimals)) : null,
    isLoading,
    connected: !!account,
    refetch,
  };
}
