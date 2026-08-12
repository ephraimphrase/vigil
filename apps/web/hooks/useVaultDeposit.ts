"use client";

import { useCallback, useState } from "react";
import { prepareContractCall, readContract } from "thirdweb";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { useTray } from "@/components/ui/ActionTray";
import { getVaultContracts, runVaultLegs, toAssetUnits, type VaultTxResult, type VaultLeg } from "@/lib/vaultTx";

export function useVaultDeposit(vaultAddress: string | undefined, tokenAddress: string | undefined) {
  const account = useActiveAccount();
  const { mutateAsync: sendTx } = useSendTransaction();
  const tray = useTray();
  const [isPending, setIsPending] = useState(false);

  const deposit = useCallback(
    async (amount: string, symbol: string): Promise<VaultTxResult> => {
      if (!vaultAddress || !tokenAddress) throw new Error("Vault not available on this chain yet");
      if (!account) throw new Error("Connect a wallet first");

      const { vault, token } = getVaultContracts(vaultAddress, tokenAddress);
      const units = await toAssetUnits(token, amount);

      const allowance = await readContract({
        contract: token,
        method: "function allowance(address owner, address spender) view returns (uint256)",
        params: [account.address, vaultAddress as `0x${string}`],
      });

      const legs: VaultLeg[] = [];
      if (allowance < units) {
        legs.push({
          label: "Approve spend",
          detail: "confirm approval in wallet",
          tx: prepareContractCall({
            contract: token,
            method: "function approve(address spender, uint256 amount) returns (bool)",
            params: [vaultAddress as `0x${string}`, units],
          }),
        });
      }
      legs.push({
        label: "Deposit",
        detail: "confirm deposit in wallet",
        tx: prepareContractCall({
          contract: vault,
          method: "function deposit(uint256 assets, address receiver) returns (uint256 shares)",
          params: [units, account.address],
        }),
      });

      setIsPending(true);
      try {
        return await runVaultLegs({
          tray,
          title: `Deposit ${amount} ${symbol}`,
          legs,
          sendTx,
          summary: { deposited: `${amount} ${symbol}` },
        });
      } finally {
        setIsPending(false);
      }
    },
    [vaultAddress, tokenAddress, account, sendTx, tray],
  );

  return { deposit, ready: !!vaultAddress && !!tokenAddress, connected: !!account, isPending };
}
