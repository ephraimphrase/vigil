import { testTokens } from "@/lib/testTokens";

const FAUCET_CHAIN_ID = "84532";

const LOGO_BY_ADDRESS = new Map(
  (testTokens[FAUCET_CHAIN_ID] ?? []).map((t) => [t.address.toLowerCase(), t.logoURI]),
);

export function logoForTokenAddress(address: string): string | undefined {
  return LOGO_BY_ADDRESS.get(address.toLowerCase()) || undefined;
}
