import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { VaultsFilterDialog } from "@/components/Vault/VaultsFilterDialog";
import { ChainIcon } from "@/components/Vault/TokenIcon";
import type { VaultFilterState } from "@/components/Vault/vaultFilters";
import { SearchIcon } from "lucide-react";
import { PiGlobeLight } from "react-icons/pi";

export type VaultTypeFilter = "all" | "single" | "lp" | "basket";

const TYPE_TABS: { id: VaultTypeFilter; label: string }[] = [
  { id: "all", label: "All Vaults" },
  { id: "single", label: "Single Asset" },
  { id: "lp", label: "LP" },
  { id: "basket", label: "Basket" },
];

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors ${
        active ? "border-violet text-violet-bright" : "border-hairline text-muted hover:text-body"
      }`}
    >
      {children}
    </button>
  );
}

interface VaultsFilterBarProps {
  typeFilter: VaultTypeFilter;
  onTypeFilterChange: (v: VaultTypeFilter) => void;
  chains: string[];
  chainFilter: string;
  onChainFilterChange: (v: string) => void;
  query: string;
  onQueryChange: (v: string) => void;
  assets: string[];
  advancedFilters: VaultFilterState;
  onAdvancedFiltersChange: (v: VaultFilterState) => void;
}

export function VaultsFilterBar({
  typeFilter,
  onTypeFilterChange,
  chains,
  chainFilter,
  onChainFilterChange,
  query,
  onQueryChange,
  assets,
  advancedFilters,
  onAdvancedFiltersChange,
}: VaultsFilterBarProps) {
  return (
    <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
      {TYPE_TABS.map((t) => (
        <FilterPill key={t.id} active={typeFilter === t.id} onClick={() => onTypeFilterChange(t.id)}>
          {t.label}
        </FilterPill>
      ))}
      <span className="h-4 w-px shrink-0 bg-hairline" />
      <FilterPill active={chainFilter === "all"} onClick={() => onChainFilterChange("all")}>
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-hairline bg-surface-2 text-violet-bright">
          <PiGlobeLight className="h-2.5 w-2.5" />
        </span>
        All Chains
      </FilterPill>
      {chains.map((chain) => (
        <FilterPill key={chain} active={chainFilter === chain} onClick={() => onChainFilterChange(chain)}>
          <ChainIcon chain={chain} />
          {chain}
        </FilterPill>
      ))}
      <span className="h-4 w-px shrink-0 bg-hairline" />
      <InputGroup className="w-64 shrink-0">
        <InputGroupAddon>
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search vault"
          type="search"
          aria-label="Search vault"
        />
      </InputGroup>
      <VaultsFilterDialog assets={assets} value={advancedFilters} onApply={onAdvancedFiltersChange} />
    </div>
  );
}
