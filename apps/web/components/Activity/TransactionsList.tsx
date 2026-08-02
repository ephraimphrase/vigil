import { PiReceiptLight } from "react-icons/pi";
import type { Table } from "@tanstack/react-table";
import { TransactionRow } from "@/components/Activity/TransactionRow";
import { EmptyState } from "@/components/EmptyState";
import { Loader } from "@/components/ui/Loader";
import type { TransactionEntry } from "@/types";

interface TransactionsListProps {
  table: Table<TransactionEntry>;
  isLoading: boolean;
}

export function TransactionsList({ table, isLoading }: TransactionsListProps) {
  const rows = table.getRowModel().rows;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        query=""
        label="transactions"
        icon={PiReceiptLight}
        message="Nothing matches the current filters."
      />
    );
  }

  return (
    <ul className="flex flex-col">
      {rows.map((row) => <TransactionRow key={row.original.id} entry={row.original} />)}
    </ul>
  );
}
