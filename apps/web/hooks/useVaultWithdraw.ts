"use client";

import { useCallback, useState } from "react";
import { prepareContractCall } from "thirdweb";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { useTray } from "@/components/ui/ActionTray";
import { getVaultContracts, runVaultLegs, toAssetUnits, type VaultTxResult, type VaultLeg } from "@/lib/vaultTx";

export function useVaultWithdraw(vaultAddress: string | undefined, tokenAddress: string | undefined) {
  const account = useActiveAccount();
  const { mutateAsync: sendTx } = useSendTransaction();
  const tray = useTray();
  const [isPending, setIsPending] = useState(false);

  const withdraw = useCallback(
    async (amount: string, symbol: string): Promise<VaultTxResult> => {
      if (!vaultAddress || !tokenAddress) throw new Error("Vault not available on this chain yet");
      if (!account) throw new Error("Connect a wallet first");

      const { vault, token } = getVaultContracts(vaultAddress, tokenAddress);
      const units = await toAssetUnits(token, amount);

      const legs: VaultLeg[] = [
        {
          label: "Withdraw",
          detail: "confirm withdrawal in wallet",
          tx: prepareContractCall({
            contract: vault,
            method: "function withdraw(uint256 assets, address receiver, address owner) returns (uint256 shares)",
            params: [units, account.address, account.address],
          }),
        },
      ];

      setIsPending(true);
      try {
        return await runVaultLegs({
          tray,
          title: `Withdraw ${amount} ${symbol}`,
          legs,
          sendTx,
          summary: { withdrawn: `${amount} ${symbol}` },
        });
      } finally {
        setIsPending(false);
      }
    },
    [vaultAddress, tokenAddress, account, sendTx, tray],
  );

  return { withdraw, ready: !!vaultAddress && !!tokenAddress, connected: !!account, isPending };
}
