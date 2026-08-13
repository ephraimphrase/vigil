
import type { ReactNode } from "react";
import { PiListLight } from "react-icons/pi";
import { StatusPill, type SystemState } from "./StatusPill";
import { KillSwitch } from "@/components/ui/KillSwitch";

interface TopbarProps {
  title: string;
  systemState: SystemState;
  autoArmed: boolean;
  onToggleAuto: () => void;
  wallet?: ReactNode;
  onMenuClick?: () => void;
}

export function Topbar({ title, systemState, autoArmed, onToggleAuto, wallet, onMenuClick }: TopbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-hairline bg-base px-5">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open menu"
            className="-ml-1 flex h-8 w-8 items-center justify-center text-muted transition-colors hover:text-body md:hidden"
          >
            <PiListLight className="h-5 w-5" />
          </button>
        )}
        <h1 className="font-display text-lg tracking-tight text-body">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <StatusPill state={systemState} />
        <KillSwitch armed={autoArmed} onToggle={onToggleAuto} />
        {wallet ?? (
          <button className="rounded-full border border-hairline px-3 py-1 font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:text-body">
            Connect
          </button>
        )}
      </div>
    </header>
  );
}
