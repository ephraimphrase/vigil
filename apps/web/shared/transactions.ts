import type { TransactionEntry, TransactionType } from "@/types";
import type { DateRange } from "@/components/ui/DateRangePicker";

export const TX_TYPE_COLOR: Record<TransactionType, string> = {
  deposit: "#5FD08A",
  withdraw: "#9F95AB",
  transfer: "#9259DA",
};

export const TX_TYPE_LABEL: Record<TransactionType, string> = {
  deposit: "Deposit",
  withdraw: "Withdraw",
  transfer: "Transfer",
};

export const ALL_TX_TYPES = Object.keys(TX_TYPE_COLOR) as TransactionType[];

// ─── FILTERS ───
export function withinRange(ts: string, range: DateRange): boolean {
  const t = new Date(ts).getTime();
  if (range.start && t < range.start.getTime()) return false;
  if (range.end && t > range.end.getTime() + 86_400_000 - 1) return false; // inclusive through end-of-day
  return true;
}

export function matchesQuery(entry: TransactionEntry, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return [entry.vaultName, entry.asset, entry.chain, entry.txHash].some((f) => f.toLowerCase().includes(q));
}

const EXPLORER_BASE: Record<string, string> = {
  Ethereum: "https://etherscan.io/tx/",
  Base: "https://basescan.org/tx/",
  "Base Sepolia": "https://sepolia.basescan.org/tx/",
};

export function explorerUrl(chain: string, txHash: string): string {
  return `${EXPLORER_BASE[chain] ?? EXPLORER_BASE.Ethereum}${txHash}`;
}

// ─── EXPORT ───
const CSV_COLUMNS: (keyof TransactionEntry)[] = [
  "id", "ts", "type", "chain", "vaultSlug", "vaultName", "asset", "amount", "amountUsd", "shares", "txHash",
];

function csvCell(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(entries: TransactionEntry[]): string {
  const header = CSV_COLUMNS.join(",");
  const rows = entries.map((e) => CSV_COLUMNS.map((c) => csvCell(e[c])).join(","));
  return [header, ...rows].join("\n");
}

export function toJson(entries: TransactionEntry[]): string {
  return JSON.stringify(entries, null, 2);
}
