import { toTokens } from "thirdweb";
import type { AdaptersQuery, DepositsQuery, VaultsQuery, WithdrawalsQuery } from "@/lib/ponder/generated/sdk";
import { weightedApy } from "./adapterApy";
import { weightedHealth } from "./protocolHealth";
import { logoForTokenAddress } from "./tokenLogo";

type PonderVault = VaultsQuery["vaults"]["items"][number];
type PonderDeposit = DepositsQuery["deposits"]["items"][number];
type PonderWithdrawal = WithdrawalsQuery["withdrawals"]["items"][number];
type PonderAdapter = AdaptersQuery["adapters"]["items"][number];

export interface PortfolioVaultCandidate {
  vaultAddress: string;
  vaultSlug: string;
  vaultName: string;
  asset: string;
  assetAddress: string;
  assetLogoURI?: string;
  decimals: number;
  /** Net of this owner's deposits minus withdrawals into this vault, in asset units - the cost-basis half of P&L. The live half (current value) needs an on-chain maxWithdraw read, done by the route, not this pure mapper. */
  costBasisAssets: number;
  apy: number;
  /** Allocation-weighted across this vault's adapters' protocol scores (lib/ponder/mappers/protocolHealth.ts) - 0 with no live adapters or no reported score yet. */
  health: number;
}

// Every vault this owner has ever deposited into or withdrawn from -
// `deposits`/`withdrawals` are expected pre-filtered to this owner (the
// route's Ponder queries do that via `where: { owner }`), so this is pure
// grouping/arithmetic, no further filtering. A vault the owner never
// touched has nothing to compute and is never a candidate to check
// on-chain.
export function toPortfolioCandidates(
  vaults: PonderVault[],
  deposits: PonderDeposit[],
  withdrawals: PonderWithdrawal[],
  adapters: PonderAdapter[],
  scoreByProtocol: Map<string, number>,
): PortfolioVaultCandidate[] {
  const vaultsById = new Map(vaults.map((v) => [v.id.toLowerCase(), v]));

  const adaptersByVault = new Map<string, PonderAdapter[]>();
  for (const a of adapters) {
    const key = a.vault.toLowerCase();
    const bucket = adaptersByVault.get(key);
    if (bucket) bucket.push(a);
    else adaptersByVault.set(key, [a]);
  }

  const touchedVaultIds = new Set<string>([
    ...deposits.map((d) => d.vault.toLowerCase()),
    ...withdrawals.map((w) => w.vault.toLowerCase()),
  ]);

  const candidates: PortfolioVaultCandidate[] = [];
  for (const vaultId of touchedVaultIds) {
    const vault = vaultsById.get(vaultId);
    if (!vault) continue;

    const decimals = vault.assetDecimals;
    const depositedRaw = deposits
      .filter((d) => d.vault.toLowerCase() === vaultId)
      .reduce((sum, d) => sum + BigInt(d.assets), 0n);
    const withdrawnRaw = withdrawals
      .filter((w) => w.vault.toLowerCase() === vaultId)
      .reduce((sum, w) => sum + BigInt(w.assets), 0n);
    const netRaw = depositedRaw > withdrawnRaw ? depositedRaw - withdrawnRaw : 0n;

    candidates.push({
      vaultAddress: vault.id,
      vaultSlug: vaultId,
      vaultName: vault.vaultName,
      asset: vault.assetSymbol,
      assetAddress: vault.asset,
      assetLogoURI: logoForTokenAddress(vault.asset),
      decimals,
      costBasisAssets: Number(toTokens(netRaw, decimals)),
      apy: weightedApy(adaptersByVault.get(vaultId) ?? []),
      health: weightedHealth(adaptersByVault.get(vaultId) ?? [], scoreByProtocol),
    });
  }

  return candidates;
}
