import { SearchIcon } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

interface VaultsToolbarProps {
  query: string;
  onQueryChange: (v: string) => void;
}

export function VaultsToolbar({ query, onQueryChange }: VaultsToolbarProps) {
  return (
    <div className="flex items-center gap-2">
      <InputGroup className="w-64">
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
    </div>
  );
}
