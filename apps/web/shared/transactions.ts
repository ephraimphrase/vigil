// ─────────────────────────────────────────────────────────────
// Transactions domain — PURE. Mirrors shared/activity.ts's structure for
// the sibling "what did MY wallet do" feed (see types/transaction.ts for
// why this is a separate domain from the automation Log). Color/label
// maps, custom date-range filtering (the Log keeps its fixed presets —
// this view's DateRangePicker needs an arbitrary {start,end}), free-text
// search, and CSV/JSON export.
// ─────────────────────────────────────────────────────────────

import type { TransactionEntry, TransactionType } from "@/types";
import type { DateRange } from "@/components/ui/DateRangePicker";

// ─── COLOR / LABEL MAPS ───
// No new hexes: deposit reuses the existing "healthy" green (inflow),
// transfer reuses primary violet (a neutral share movement). Withdraw
// deliberately stays neutral grey rather than amber/red — a withdrawal is
// a routine user action, not a risk event, and DESIGN.md reserves
// red/amber for score-band severity.
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

// ─── EXPLORER LINKS ───
const EXPLORER_BASE: Record<string, string> = {
  Ethereum: "https://etherscan.io/tx/",
  Base: "https://basescan.org/tx/",
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
