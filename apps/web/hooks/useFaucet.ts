"use client";

// ─────────────────────────────────────────────────────────────
// useFaucet — claims test tokens from the Faucet contract (apps/contracts/
// src/token/Faucet.sol) in a single claimMany() transaction/signature,
// driving an ActionTray job through it. Faucet.sol has no post-deploy mint
// on the SeedToken clones it distributes - see that contract's header
// comment for why this exists instead of a simpler per-token mint() call.
// ─────────────────────────────────────────────────────────────

import { useCallback, useState } from "react";
import { getContract, prepareContractCall, prepareEvent, parseEventLogs, waitForReceipt } from "thirdweb";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";
import { thirdwebClient } from "@/lib/thirdweb-client";
import { chainForId } from "@/lib/chains";
import { deployedContracts } from "@/lib/deployedContracts";
import { useTray } from "@/components/ui/ActionTray";

const FAUCET_CHAIN_ID = "84532";

const claimedEvent = prepareEvent({
  signature: "event Claimed(address indexed user, address indexed token, uint256 amount)",
});
const skippedEvent = prepareEvent({
  signature: "event Skipped(address indexed user, address indexed token, uint256 availableAt)",
});

type ContractsByChain = Record<string, Record<string, { address: string; abi: readonly unknown[] }>>;

export interface FaucetToken {
  address: string;
  symbol: string;
}

export interface FaucetClaimResult {
  claimed: string[];
  skipped: string[];
}

export function useFaucetContract() {
  const entry = (deployedContracts as ContractsByChain)[FAUCET_CHAIN_ID]?.Faucet;
  if (!thirdwebClient || !entry) return null;
  return getContract({
    client: thirdwebClient,
    chain: chainForId(FAUCET_CHAIN_ID),
    address: entry.address,
    abi: entry.abi as [],
  });
}

export function useFaucet() {
  const contract = useFaucetContract();
  const account = useActiveAccount();
  const { mutateAsync: sendTx } = useSendTransaction();
  const tray = useTray();
  const [isPending, setIsPending] = useState(false);

  const claimMany = useCallback(
    async (tokens: FaucetToken[]): Promise<FaucetClaimResult | undefined> => {
      if (!contract) throw new Error("Faucet not deployed on this chain yet");
      if (!account) throw new Error("Connect a wallet first");
      if (tokens.length === 0) return undefined;

      setIsPending(true);
      const job = tray.start({
        title: `Get ${tokens.length} test token${tokens.length === 1 ? "" : "s"}`,
        steps: ["Submit transaction", "Confirm on chain"],
      });
      job.detail("confirm in wallet");

      try {
        const tx = prepareContractCall({
          contract,
          method: "function claimMany(address[] tokens)",
          params: [tokens.map((t) => t.address as `0x${string}`)],
        });
        const submitted = await sendTx(tx);
        job.advance();
        job.detail("waiting for confirmation");

        const receipt = await waitForReceipt(submitted);
        const claimedLogs = parseEventLogs({ logs: receipt.logs, events: [claimedEvent] });
        const skippedLogs = parseEventLogs({ logs: receipt.logs, events: [skippedEvent] });

        const symbolFor = (tokenAddress: string) =>
          tokens.find((t) => t.address.toLowerCase() === tokenAddress.toLowerCase())?.symbol.toUpperCase() ??
          tokenAddress;

        const claimed = claimedLogs.map((log) => symbolFor(log.args.token));
        const skipped = skippedLogs.map((log) => symbolFor(log.args.token));

        job.finish({
          summary: {
            claimed: `${claimed.length}/${tokens.length}`,
            ...(skipped.length > 0 ? { "on cooldown": skipped.join(", ") } : {}),
          },
        });

        return { claimed, skipped };
      } catch (e) {
        job.fail({ message: e instanceof Error ? e.message : "Claim failed" });
        throw e;
      } finally {
        setIsPending(false);
      }
    },
    [contract, account, sendTx, tray],
  );

  return { claimMany, ready: !!contract, connected: !!account, isPending };
}
