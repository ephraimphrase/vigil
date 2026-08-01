"use client";

// Tree-style disclosure row: mono uppercase label (+ optional always-visible
// summary value) with a chevron toggle. Body always renders - open/closed is
// a grid-template-rows 0fr<->1fr transition (not conditional mount/unmount),
// which is what makes the height animate smoothly without measuring it in
// JS. Used by VaultInfoTab for the Addresses/Chain/Asset Type/Vault
// Type/Fees blocks - each collapsed to its label+value by default,
// expanding to show the explanatory blurb underneath.

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface CollapsibleProps {
  label: string;
  value?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function Collapsible({ label, value, defaultOpen = false, children }: CollapsibleProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-hairline/60 first:border-t-0">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-3 text-left"
      >
        <span className="shrink-0 font-mono text-xs uppercase tracking-wider text-muted/60">{label}</span>
        <div className="flex items-center gap-2">
          {value != null && <span className="text-sm text-body">{value}</span>}
          <ChevronDown className={`size-3.5 shrink-0 text-muted/50 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <div className="pb-3 text-sm leading-relaxed text-muted/60">{children}</div>
        </div>
      </div>
    </div>
  );
}
