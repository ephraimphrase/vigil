import { tokenPriceIds } from "@/lib/tokenPriceIds";
import { fetchUsdPrices } from "@/lib/coingecko";

const CHAIN_ID = "84532";

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
