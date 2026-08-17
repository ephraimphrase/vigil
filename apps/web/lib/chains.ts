import { defineChain } from "thirdweb/chains";

const RPC_URLS: Record<string, string> = {
  "31337": "http://localhost:8545",
  "8453": "https://mainnet.base.org",
  "84532": "https://sepolia.base.org",
};

export function chainForId(chainId: string) {
  return defineChain({
    id: Number(chainId),
    rpc: RPC_URLS[chainId] ?? RPC_URLS["31337"],
  });
}

const EXPLORER_URLS: Record<string, string> = {
  "8453": "https://basescan.org",
  "84532": "https://sepolia.basescan.org",
};

export function explorerTxUrl(chainId: string, txHash: string): string | null {
  const base = EXPLORER_URLS[chainId];
  return base ? `${base}/tx/${txHash}` : null;
}
