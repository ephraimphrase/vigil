import { NextResponse } from "next/server";
import { ponder } from "@/lib/ponder/client";
import { toVaultData } from "@/lib/ponder/mappers/vaultData";
import { getTokenPrices, type PriceByAddress } from "@/lib/tokenPrices";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const id = slug.toLowerCase();
  const [{ vault }, { adapters }, { deposits }, { withdrawals }, prices] = await Promise.all([
    ponder.Vault({ id }),
    ponder.Adapters({ where: { vault: id } }),
    ponder.Deposits({ where: { vault: id }, limit: 1000 }),
    ponder.Withdrawals({ where: { vault: id }, limit: 1000 }),
    // Pricing is best-effort - a CoinGecko hiccup should degrade TVL to
    // "unknown" (estimateTvlUsd(..., null) -> NaN -> "-"), not take down
    // the vault detail page.
    getTokenPrices().catch((): PriceByAddress => ({})),
  ]);
  if (!vault) {
    return NextResponse.json({ error: `No vault matches "${slug}"` }, { status: 404 });
  }
  const priceUsd = prices[vault.asset.toLowerCase()] ?? null;
  return NextResponse.json(toVaultData(vault, adapters.items, deposits.items, withdrawals.items, priceUsd));
}
