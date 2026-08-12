import { NextResponse } from "next/server";
import { ponder } from "@/lib/ponder/client";
import { toDepositTransaction, toWithdrawTransaction } from "@/lib/ponder/mappers/transactionFlows";
import { buildVaultsById } from "@/lib/ponder/mappers/vaultMeta";
import { getTokenPrices, type PriceByAddress } from "@/lib/tokenPrices";

export async function GET() {
  const [{ vaults }, { deposits }, { withdrawals }, prices] = await Promise.all([
    ponder.Vaults({ limit: 1000 }),
    ponder.Deposits({ limit: 500, orderBy: "timestamp", orderDirection: "desc" }),
    ponder.Withdrawals({ limit: 500, orderBy: "timestamp", orderDirection: "desc" }),
    // Pricing is best-effort - a CoinGecko hiccup should degrade amountUsd
    // to "unknown" (rendered as "-" by TransactionRow), not take down the
    // whole Transactions view.
    getTokenPrices().catch((): PriceByAddress => ({})),
  ]);

  const vaultsById = buildVaultsById(vaults.items);

  const entries = [
    ...deposits.items.map((d) => toDepositTransaction(d, vaultsById, prices)),
    ...withdrawals.items.map((w) => toWithdrawTransaction(w, vaultsById, prices)),
  ].sort((a, b) => b.ts.localeCompare(a.ts));

  return NextResponse.json({ entries });
}
