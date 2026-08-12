import {
  getContract,
  readContract,
  toUnits,
  waitForReceipt,
  type PreparedTransaction,
  type ThirdwebContract,
} from "thirdweb";
import { thirdwebClient } from "@/lib/thirdweb-client";
import { chainForId, explorerTxUrl } from "@/lib/chains";
import type { TrayContextValue } from "@/components/ui/ActionTray";

export const VAULT_CHAIN_ID = "84532";

export interface VaultContracts {
  vault: ThirdwebContract;
  token: ThirdwebContract;
}

export interface VaultTxResult {
  txHash: string;
  explorerUrl: string | null;
}

export function getVaultContracts(vaultAddress: string, tokenAddress: string): VaultContracts {
  if (!thirdwebClient) throw new Error("Wallet connect is not configured");
  const chain = chainForId(VAULT_CHAIN_ID);
  return {
    vault: getContract({ client: thirdwebClient, chain, address: vaultAddress }),
    token: getContract({ client: thirdwebClient, chain, address: tokenAddress }),
  };
}

export async function tokenDecimals(token: ThirdwebContract): Promise<number> {
  return readContract({
    contract: token,
    method: "function decimals() view returns (uint8)",
    params: [],
  });
}

export async function toAssetUnits(token: ThirdwebContract, amount: string): Promise<bigint> {
  const decimals = await tokenDecimals(token);
  const units = toUnits(amount, decimals);
  if (units <= 0n) throw new Error("Enter an amount greater than zero");
  return units;
}

type SendTxFn = (tx: PreparedTransaction) => Promise<Parameters<typeof waitForReceipt>[0]>;

export interface VaultLeg {
  label: string;
  detail: string;
  tx: PreparedTransaction;
}

export async function runVaultLegs(args: {
  tray: TrayContextValue;
  title: string;
  legs: VaultLeg[];
  sendTx: SendTxFn;
  summary: Record<string, string>;
}): Promise<VaultTxResult> {
  const { tray, title, legs, sendTx, summary } = args;
  const job = tray.start({ title, steps: legs.map((leg) => leg.label) });
  let txHash = "";

  try {
    for (let i = 0; i < legs.length; i++) {
      const leg = legs[i]!;
      const isLast = i === legs.length - 1;

      job.detail(leg.detail);
      const submitted = await sendTx(leg.tx);

      if (!isLast) {
        await waitForReceipt(submitted);
        job.advance();
        continue;
      }

      job.advance();
      job.detail("waiting for confirmation");
      const receipt = await waitForReceipt(submitted);
      txHash = receipt.transactionHash;
    }

    job.finish({ summary });
    return { txHash, explorerUrl: explorerTxUrl(VAULT_CHAIN_ID, txHash) };
  } catch (e) {
    job.fail({ message: e instanceof Error ? e.message : "Transaction failed" });
    throw e;
  }
}
