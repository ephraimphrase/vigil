import { NextResponse } from "next/server";
import { getContract, readContract, toTokens } from "thirdweb";
import { ponder } from "@/lib/ponder/client";
import { toPortfolioCandidates } from "@/lib/ponder/mappers/portfolio";
import { latestScoreByProtocol } from "@/lib/ponder/mappers/protocolHealth";
import { getTokenPrices, type PriceByAddress } from "@/lib/tokenPrices";
import { thirdwebClient } from "@/lib/thirdweb-client";
import { chainForId } from "@/lib/chains";
import type { PortfolioSummaryData, PortfolioVaultPosition } from "@/types";

// Same chain every other route/hook hardcodes - Vigil only indexes Base Sepolia.
const CHAIN_ID = "84532";

export async function GET(_req: Request, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const owner = address.toLowerCase();

  if (!thirdwebClient) {
    return NextResponse.json({ error: "Wallet reads are not configured" }, { status: 502 });
  }
  const client = thirdwebClient;

  const [{ vaults }, { deposits }, { withdrawals }, { adapters }, { protocolRegistereds }, { scoreUpdateds }, { emergencyZeroeds }, prices] =
    await Promise.all([
      ponder.Vaults({ limit: 1000 }),
      ponder.Deposits({ where: { owner }, limit: 1000 }),
      ponder.Withdrawals({ where: { owner }, limit: 1000 }),
      ponder.Adapters({ limit: 1000 }),
      ponder.ProtocolRegistereds({ limit: 1000 }),
      ponder.ScoreUpdateds({ limit: 1000 }),
      ponder.EmergencyZeroeds({ limit: 1000 }),
      // Pricing is best-effort - a CoinGecko hiccup should degrade
      // currentUsd/costBasisUsd/pnlUsd to "unknown", not fail the portfolio.
      getTokenPrices().catch((): PriceByAddress => ({})),
    ]);

  const scoreByProtocol = latestScoreByProtocol(protocolRegistereds.items, scoreUpdateds.items, emergencyZeroeds.items);
  const candidates = toPortfolioCandidates(vaults.items, deposits.items, withdrawals.items, adapters.items, scoreByProtocol);
  const chain = chainForId(CHAIN_ID);

  const positions = await Promise.all(
    candidates.map(async (c): Promise<PortfolioVaultPosition | null> => {
      let currentAssets: number;
      try {
        const vault = getContract({ client, chain, address: c.vaultAddress });
        const maxWithdrawRaw = await readContract({
          contract: vault,
          method: "function maxWithdraw(address owner) view returns (uint256)",
          params: [owner as `0x${string}`],
        });
        currentAssets = Number(toTokens(maxWithdrawRaw, c.decimals));
      } catch {
        // A single vault's read failing (RPC hiccup) shouldn't fail the
        // whole portfolio - drop it from this response, not zero it out.
        return null;
      }

      const priceUsd = prices[c.assetAddress.toLowerCase()] ?? null;
      return {
        vaultSlug: c.vaultSlug,
        vaultName: c.vaultName,
        asset: c.asset,
        assetLogoURI: c.assetLogoURI,
        currentAssets,
        currentUsd: priceUsd != null ? currentAssets * priceUsd : null,
        costBasisUsd: priceUsd != null ? c.costBasisAssets * priceUsd : null,
        pnlUsd: priceUsd != null ? (currentAssets - c.costBasisAssets) * priceUsd : null,
        apy: c.apy,
        health: c.health,
      };
    }),
  );

  const held = positions
    .filter((p): p is PortfolioVaultPosition => p != null)
    .filter((p) => p.currentAssets > 0);

  const totalValueUsd = held.reduce((sum, p) => sum + (p.currentUsd ?? 0), 0);
  const pnlUsd = held.reduce((sum, p) => sum + (p.pnlUsd ?? 0), 0);
  const currentApy =
    totalValueUsd > 0 ? held.reduce((sum, p) => sum + p.apy * (p.currentUsd ?? 0), 0) / totalValueUsd : 0;

  const body: PortfolioSummaryData = {
    totalValueUsd,
    pnlUsd,
    vaultsCount: held.length,
    currentApy,
    // Not derivable - see types/portfolio.ts.
    apy30d: null,
    positions: held,
  };

  return NextResponse.json(body);
}
