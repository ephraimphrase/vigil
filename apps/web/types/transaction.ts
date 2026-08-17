export type TransactionType = "deposit" | "withdraw" | "transfer";

export interface TransactionEntry {
  id: string;
  ts: string;
  type: TransactionType;
  chain: string;       
  vaultSlug: string;
  vaultName: string;
  asset: string;
  amount: number; // asset units
  amountUsd: number | null;
  shares?: number;
  txHash: string;
  sender: string; // lowercase hex
}

export interface TransactionsData {
  entries: TransactionEntry[];
}
