"use client";

// ─────────────────────────────────────────────────────────────
// useVaultDeposit — deposits the vault's asset token into a VigilVault
// (apps/contracts/src/vault/VigilVault.sol), a stock OZ ERC4626: approve
// the asset to the vault (skipped if already approved for enough), then
// deposit(assets, receiver). Drives an ActionTray job through both legs,
// same pattern as useFaucet.ts.
// ─────────────────────────────────────────────────────────────

import { useCallback, useState } from "react";
import { getContract, prepareContractCall, readContract, toUnits, waitForReceipt } from "thirdweb";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { thirdwebClient } from "@/lib/thirdweb-client";
import { chainForId, explorerTxUrl } from "@/lib/chains";
import { useTray } from "@/components/ui/ActionTray";

const VAULT_CHAIN_ID = "84532";

export interface VaultDepositResult {
  txHash: string;
  explorerUrl: string | null;
}

export function useVaultDeposit(vaultAddress: string | undefined, tokenAddress: string | undefined) {
  const account = useActiveAccount();
  const { mutateAsync: sendTx } = useSendTransaction();
  const tray = useTray();
  const [isPending, setIsPending] = useState(false);

  const deposit = useCallback(
    async (amount: string, symbol: string): Promise<VaultDepositResult> => {
      if (!thirdwebClient) throw new Error("Wallet connect is not configured");
      if (!vaultAddress || !tokenAddress) throw new Error("Vault not available on this chain yet");
      if (!account) throw new Error("Connect a wallet first");

      const chain = chainForId(VAULT_CHAIN_ID);
      const token = getContract({ client: thirdwebClient, chain, address: tokenAddress });
      const vault = getContract({ client: thirdwebClient, chain, address: vaultAddress });

      const decimals = await readContract({
        contract: token,
        method: "function decimals() view returns (uint8)",
        params: [],
      });
      const units = toUnits(amount, decimals);
      if (units <= 0n) throw new Error("Enter an amount greater than zero");

      const allowance = await readContract({
        contract: token,
        method: "function allowance(address owner, address spender) view returns (uint256)",
        params: [account.address, vaultAddress as `0x${string}`],
      });
      const needsApproval = allowance < units;

      setIsPending(true);
      const job = tray.start({
        title: `Deposit ${amount} ${symbol}`,
        steps: needsApproval ? ["Approve spend", "Deposit", "Confirm on chain"] : ["Deposit", "Confirm on chain"],
      });

      try {
        if (needsApproval) {
          job.detail("confirm approval in wallet");
          const approveTx = prepareContractCall({
            contract: token,
            method: "function approve(address spender, uint256 amount) returns (bool)",
            params: [vaultAddress as `0x${string}`, units],
          });
          const submittedApprove = await sendTx(approveTx);
          job.detail("waiting for approval");
          await waitForReceipt(submittedApprove);
          job.advance();
        }

        job.detail("confirm deposit in wallet");
        const depositTx = prepareContractCall({
          contract: vault,
          method: "function deposit(uint256 assets, address receiver) returns (uint256 shares)",
          params: [units, account.address],
        });
        const submittedDeposit = await sendTx(depositTx);
        job.advance();
        job.detail("waiting for confirmation");
        const receipt = await waitForReceipt(submittedDeposit);

        const txHash: string = receipt.transactionHash;
        const explorerUrl = explorerTxUrl(VAULT_CHAIN_ID, txHash);
        job.finish({ summary: { deposited: `${amount} ${symbol}` } });
        return { txHash, explorerUrl };
      } catch (e) {
        job.fail({ message: e instanceof Error ? e.message : "Deposit failed" });
        throw e;
      } finally {
        setIsPending(false);
      }
    },
    [vaultAddress, tokenAddress, account, sendTx, tray],
  );

  return { deposit, ready: !!vaultAddress && !!tokenAddress, connected: !!account, isPending };
}
