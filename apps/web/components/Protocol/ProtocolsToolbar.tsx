import { SearchIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

interface ProtocolsToolbarProps {
  query: string;
  onQueryChange: (v: string) => void;
}

export function ProtocolsToolbar({ query, onQueryChange }: ProtocolsToolbarProps) {
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
    </div>
  );
}
