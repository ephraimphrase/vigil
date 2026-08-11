import { testTokens } from "@/lib/testTokens";

const FAUCET_CHAIN_ID = "84532";

const LOGO_BY_ADDRESS = new Map(
  (testTokens[FAUCET_CHAIN_ID] ?? []).map((t) => [t.address.toLowerCase(), t.logoURI]),
);

// Vaults only carry their asset's address (Ponder's `vault.asset`), not a
// logo - testTokens.ts (synced from the same token.json the vault's asset
// was deployed from) is the one place that maps a test token's address to
// its real CoinGecko icon.
export function logoForTokenAddress(address: string): string | undefined {
  return LOGO_BY_ADDRESS.get(address.toLowerCase()) || undefined;
}
