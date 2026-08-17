import { PiGlobeLight, PiMagnifyingGlassLight } from "react-icons/pi";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { FilterSelect } from "@/components/ui/FilterSelect";
import { DateRangePicker, type DateRange } from "@/components/ui/DateRangePicker";
import { ChainIcon } from "@/components/Vault/TokenIcon";
import { ALL_TX_TYPES, TX_TYPE_COLOR, TX_TYPE_LABEL, toCsv, toJson } from "@/shared/transactions";
import { downloadBlob } from "@/shared/activity";
import type { TransactionEntry, TransactionType } from "@/types";

interface TransactionsHeaderProps {
  chains: string[];
  chainFilter: Set<string>;
  onChainFilterChange: (v: Set<string>) => void;
  typeFilter: Set<TransactionType>;
  onTypeFilterChange: (v: Set<TransactionType>) => void;
  dateRange: DateRange;
  onDateRangeChange: (v: DateRange) => void;
  query: string;
  onQueryChange: (v: string) => void;
  visibleEntries: TransactionEntry[];
  visibleCount: number;
  totalCount: number;
}

export function TransactionsHeader({
  chains, chainFilter, onChainFilterChange,
  typeFilter, onTypeFilterChange,
  dateRange, onDateRangeChange,
  query, onQueryChange,
  visibleEntries, visibleCount, totalCount,
}: TransactionsHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <FilterSelect
        label="Chain"
        allLabel="All Chains"
        icon={
          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-hairline bg-surface-2 text-violet-bright">
            <PiGlobeLight className="h-2.5 w-2.5" />
          </span>
        }
        options={chains.map((c) => ({ id: c, label: c, icon: <ChainIcon chain={c} /> }))}
        selected={chainFilter}
        onChange={onChainFilterChange}
      />

      <FilterSelect
        label="Transaction type"
        allLabel="Transaction type"
        options={ALL_TX_TYPES.map((t) => ({
          id: t,
          label: TX_TYPE_LABEL[t],
          icon: <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: TX_TYPE_COLOR[t] }} />,
        }))}
        selected={typeFilter}
        onChange={onTypeFilterChange}
      />

      <DateRangePicker value={dateRange} onChange={onDateRangeChange} placeholder="Select date range" />

      <InputGroup className="w-64 shrink-0">
        <InputGroupAddon>
          <PiMagnifyingGlassLight aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search activity"
          type="search"
          aria-label="Search activity"
        />
      </InputGroup>

      <div className="flex-1" />

      <span className="font-mono text-xs tabular-nums text-muted">{visibleCount} / {totalCount}</span>

      <div className="flex items-center gap-2">
        <button
          onClick={() => downloadBlob("vigil-transactions.csv", toCsv(visibleEntries), "text/csv")}
          className="rounded-full border border-hairline px-3 py-1 font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:border-violet hover:text-violet-bright"
        >
          Export CSV
        </button>
        <button
          onClick={() => downloadBlob("vigil-transactions.json", toJson(visibleEntries), "application/json")}
          className="rounded-full border border-hairline px-3 py-1 font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:border-violet hover:text-violet-bright"
        >
          Export JSON
        </button>
      </div>
    </div>
  );
}
