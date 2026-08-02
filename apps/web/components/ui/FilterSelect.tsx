// ─────────────────────────────────────────────────────────────
// FilterSelect — anchored multi-select dropdown pill. Reusable "select"
// filter control (Chain, Transaction type, ...), built on @base-ui/react's
// Popover (same primitive family as the Dialog VaultsFilterDialog already
// uses, just anchored instead of centered). Checkbox rows reuse
// VaultsFilterDialog's ToggleRow styling (rounded-none, hairline border,
// accent-violet) rather than introducing base-ui's own Checkbox part.
//
// Empty selection = "match everything" (the collapsed "All ..." state) —
// deliberately opt-in, the opposite convention from the Log's kind chips
// (which start fully-selected and you opt out per chip). Both read
// correctly for their own control; see shared/transactions.ts's header
// comment for why they differ.
// ─────────────────────────────────────────────────────────────

"use client";

import type { ReactNode } from "react";
import { Popover } from "@base-ui/react/popover";
import { PiCaretDownLight } from "react-icons/pi";

export interface FilterSelectOption<T extends string> {
  id: T;
  label: string;
  icon?: ReactNode;
}

interface FilterSelectProps<T extends string> {
  label: string;
  allLabel: string;
  options: FilterSelectOption<T>[];
  selected: Set<T>;
  onChange: (next: Set<T>) => void;
  icon?: ReactNode;
  className?: string;
}

function toggle<T extends string>(set: Set<T>, id: T): Set<T> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export function FilterSelect<T extends string>({ label, allLabel, options, selected, onChange, icon, className = "" }: FilterSelectProps<T>) {
  const active = selected.size > 0;
  const triggerLabel =
    selected.size === 0
      ? allLabel
      : selected.size === 1
        ? (options.find((o) => selected.has(o.id))?.label ?? allLabel)
        : `${allLabel.replace(/^All /, "")} (${selected.size})`;

  return (
    <Popover.Root>
      <Popover.Trigger
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-wider transition-colors ${
          active ? "border-violet text-violet-bright" : "border-hairline text-muted hover:text-body"
        } ${className}`}
      >
        {icon}
        {triggerLabel}
        <PiCaretDownLight className="h-3 w-3 shrink-0" />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={6}>
          <Popover.Popup className="w-56 origin-[var(--transform-origin)] rounded-none border border-hairline bg-panel p-1.5 transition-all data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <div className="flex items-center justify-between px-1.5 py-1">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted/60">{label}</span>
              {active && (
                <button
                  type="button"
                  onClick={() => onChange(new Set())}
                  className="font-mono text-[10px] uppercase tracking-wider text-muted transition-colors hover:text-body"
                >
                  Clear
                </button>
              )}
            </div>
            <ul className="flex flex-col">
              {options.map((o) => (
                <li key={o.id}>
                  <label className="flex cursor-pointer items-center gap-2 px-1.5 py-1.5 text-sm text-body transition-colors hover:bg-base">
                    <input
                      type="checkbox"
                      checked={selected.has(o.id)}
                      onChange={() => onChange(toggle(selected, o.id))}
                      className="h-3.5 w-3.5 shrink-0 rounded-none border border-hairline bg-transparent accent-violet"
                    />
                    {o.icon}
                    <span className="truncate">{o.label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
