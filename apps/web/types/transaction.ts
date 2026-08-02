// ─────────────────────────────────────────────────────────────
// TransactionEntry — the user's own wallet activity (deposit/withdraw/
// transfer into a vault). Distinct layer from ActivityEntry (activity.ts):
// this is "what did MY wallet do," ActivityEntry is "what did Vigil's
// automation do to the vault's protocol allocations." VigilVault is a
// single ERC4626 vault (see apps/contracts/src/vault/VigilVault.sol), so
// the only real on-chain user actions are deposit, withdraw, and an ERC20
// share transfer — no Stake/Unstake/Swap the way Yearn's gauge + zap
// contracts have, since we don't have those contracts.
// ─────────────────────────────────────────────────────────────

export type TransactionType = "deposit" | "withdraw" | "transfer";

export interface TransactionEntry {
  id: string;
  ts: string;
  type: TransactionType;
  chain: string;        // matches VaultInfo.chain ("Ethereum" | "Base")
  vaultSlug: string;
  vaultName: string;
  asset: string;
  amount: number;        // in asset units, always positive
  amountUsd: number;
  shares?: number;
  txHash: string;
}

export interface TransactionsData {
  entries: TransactionEntry[];
}
