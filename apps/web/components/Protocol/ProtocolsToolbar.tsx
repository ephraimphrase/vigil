import { SearchIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

interface ProtocolsToolbarProps {
    query: string;
    onQueryChange: (v: string) => void;
    watchOnly: boolean;
    onWatchOnlyToggle: () => void;
  }

  export function ProtocolsToolbar({
    query,
    onQueryChange,
    watchOnly,
    onWatchOnlyToggle,
  }: ProtocolsToolbarProps) {
    return (
      <div className="flex items-center gap-2">
        <InputGroup className="w-64">
          <InputGroupAddon>
            <SearchIcon aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search protocol"
            type="search"
            aria-label="Search protocol"
          />
        </InputGroup>
        <button
          onClick={onWatchOnlyToggle}
          aria-pressed={watchOnly}
          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
            watchOnly
              ? "border-violet text-violet-bright"
              : "border-[#CAC0D5]/20 text-text-muted hover:border-[#CAC0D5]/40"
          }`}
        >
          Watchlist
        </button>
      </div>
    );
  }