import type { ComponentType } from "react";
import { PiMagnifyingGlassLight, PiTrayLight } from "react-icons/pi";

interface EmptyStateProps {
  query: string;
  label?: string;
  message?: string;
  icon?: ComponentType<{ className?: string }>;
}

export function EmptyState({ query, label = "protocols", message, icon: Icon }: EmptyStateProps) {
  const ResolvedIcon = Icon ?? (query ? PiMagnifyingGlassLight : PiTrayLight);
  const text = message ?? (query ? `Nothing matches "${query}".` : "Nothing to monitor yet.");
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-2">
      <ResolvedIcon className="h-6 w-6 text-text-muted/30" />
      <span className="font-mono text-xs uppercase tracking-wider text-text-muted">
        No {label}
      </span>
      <span className="text-sm text-text-muted/60">
        {text}
      </span>
    </div>
  );
}
