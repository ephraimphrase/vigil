import { tokenPriceIds } from "@/lib/tokenPriceIds";
import { fetchUsdPrices } from "@/lib/coingecko";

// Same chain every other route/hook hardcodes (chainForId, useTokenBalance,
// useDepositableTokens's FAUCET_CHAIN_ID) - Vigil only indexes Base Sepolia.
const CHAIN_ID = "84532";

// CoinGecko's free tier rate-limits aggressively; prices don't need to be
// per-request-fresh. One shared in-memory cache per server process, reused
// by every server-side caller (the /api/token-prices route the wallet page
// polls, and the vault routes pricing TVL) - a stale-but-recent price beats
// both a 429 and a second redundant CoinGecko call in the same tick.
const CACHE_TTL_MS = 60_000;

export type PriceByAddress = Record<string, number | null>;

let cache: { data: PriceByAddress; expiresAt: number } | null = null;

async function loadPrices(): Promise<PriceByAddress> {
  const idsByAddress = tokenPriceIds[CHAIN_ID] ?? {};
  const pricesById = await fetchUsdPrices(Object.values(idsByAddress));

  const byAddress: PriceByAddress = {};
  for (const [address, id] of Object.entries(idsByAddress)) {
    byAddress[address] = pricesById[id] ?? null;
  }
  return byAddress;
}

export async function getTokenPrices(): Promise<PriceByAddress> {
  const now = Date.now();
  if (cache && cache.expiresAt >= now) return cache.data;

  try {
    const data = await loadPrices();
    cache = { data, expiresAt: now + CACHE_TTL_MS };
    return data;
  } catch (e) {
    if (cache) return cache.data; // stale-while-error beats no data
    throw e;
  }
}
