import { defineChain } from "thirdweb/chains";

// Vigil only ever deploys locally (anvil), to a Base fork/mainnet, or to
// Base Sepolia - see apps/contracts/.env.example. Extend this map if that
// ever changes; guessing a public RPC for an unrecognized chain id would
// be worse than just falling back to local anvil.
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
