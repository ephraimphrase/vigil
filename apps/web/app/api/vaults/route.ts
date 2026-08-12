import { NextResponse } from "next/server";
import { ponder } from "@/lib/ponder/client";
import { toVaultSummary } from "@/lib/ponder/mappers/vaultSummary";
import { getTokenPrices, type PriceByAddress } from "@/lib/tokenPrices";

function groupByVault<T extends { vault: string }>(items: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const item of items) {
    const key = item.vault.toLowerCase();
    const bucket = grouped.get(key);
    if (bucket) bucket.push(item);
    else grouped.set(key, [item]);
  }
  return grouped;
}

export async function GET() {
  const [{ vaults }, { adapters }, { deposits }, { withdrawals }, prices] = await Promise.all([
    ponder.Vaults({ limit: 1000 }),
    ponder.Adapters({ limit: 1000 }),
    ponder.Deposits({ limit: 1000 }),
    ponder.Withdrawals({ limit: 1000 }),
    // Pricing is best-effort - a CoinGecko hiccup should degrade TVL to
    // "unknown" (estimateTvlUsd(..., null) -> NaN -> "-"), not take down
    // the whole vault list.
    getTokenPrices().catch((): PriceByAddress => ({})),
  ]);

  const adaptersByVault = groupByVault(adapters.items);
  const depositsByVault = groupByVault(deposits.items);
  const withdrawalsByVault = groupByVault(withdrawals.items);

  return NextResponse.json(
    vaults.items.map((v) => {
      const key = v.id.toLowerCase();
      return toVaultSummary(
        v,
        adaptersByVault.get(key) ?? [],
        depositsByVault.get(key) ?? [],
        withdrawalsByVault.get(key) ?? [],
        prices[v.asset.toLowerCase()] ?? null,
      );
    }),
  );
}
