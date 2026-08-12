const COINGECKO_API = "https://api.coingecko.com/api/v3";
const CHUNK_SIZE = 250;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function fetchUsdPrices(coingeckoIds: string[]): Promise<Record<string, number>> {
  const uniqueIds = [...new Set(coingeckoIds)];
  if (uniqueIds.length === 0) return {};

  const chunks = await Promise.all(
    chunk(uniqueIds, CHUNK_SIZE).map(async (ids) => {
      const res = await fetch(`${COINGECKO_API}/simple/price?ids=${ids.join(",")}&vs_currencies=usd`);
      if (!res.ok) throw new Error(`CoinGecko simple/price -> HTTP ${res.status}`);
      return res.json() as Promise<Record<string, { usd?: number }>>;
    }),
  );

  const prices: Record<string, number> = {};
  for (const c of chunks) {
    for (const [id, v] of Object.entries(c)) {
      if (typeof v.usd === "number") prices[id] = v.usd;
    }
  }
  return prices;
}
