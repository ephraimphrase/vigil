import type { MouseEvent } from "react";

interface WatchDotProps {
  active: boolean;
  onToggle: (e: MouseEvent) => void;
}

export function WatchDot({ active, onToggle }: WatchDotProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      aria-label={active ? "Remove from watchlist" : "Add to watchlist"}
      className="flex h-5 w-5 items-center justify-center rounded-full border border-hairline transition-colors hover:border-violet"
    >
      <span
        className={`h-1.5 w-1.5 rounded-full transition-colors ${
          active ? "bg-violet-bright shadow-[0_0_3.76px_0_#9259DA]" : "bg-transparent"
        }`}
      />
    </button>
  );
}
