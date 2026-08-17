import { NextResponse } from "next/server";
import { ponder } from "@/lib/ponder/client";
import { toVaultData } from "@/lib/ponder/mappers/vaultData";
import { netCostBasisAssets } from "@/lib/ponder/mappers/costBasis";
import { getTokenPrices, type PriceByAddress } from "@/lib/tokenPrices";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const id = slug.toLowerCase();
  const owner = new URL(req.url).searchParams.get("address")?.toLowerCase() ?? null;

  const [{ vault }, { adapters }, { deposits }, { withdrawals }, prices] = await Promise.all([
    ponder.Vault({ id }),
    ponder.Adapters({ where: { vault: id } }),
    ponder.Deposits({ where: { vault: id }, limit: 1000 }),
    ponder.Withdrawals({ where: { vault: id }, limit: 1000 }),
    getTokenPrices().catch((): PriceByAddress => ({})),
  ]);
  if (!vault) {
    return NextResponse.json({ error: `No vault matches "${slug}"` }, { status: 404 });
  }
  const priceUsd = prices[vault.asset.toLowerCase()] ?? null;

  let costBasisUsd: number | null = null;
  if (owner && priceUsd != null) {
    const ownerDeposits = deposits.items.filter((d) => d.owner.toLowerCase() === owner);
    const ownerWithdrawals = withdrawals.items.filter((w) => w.owner.toLowerCase() === owner);
    costBasisUsd = netCostBasisAssets(ownerDeposits, ownerWithdrawals, vault.assetDecimals) * priceUsd;
  }

  return NextResponse.json(
    toVaultData(vault, adapters.items, deposits.items, withdrawals.items, priceUsd, costBasisUsd),
  );
}
