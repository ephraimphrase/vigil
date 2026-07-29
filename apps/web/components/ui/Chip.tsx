import type { ReactNode } from "react";

interface ChipProps {
  children: ReactNode;
  dotColor?: string;
  mono?: boolean;
  className?: string;
}

export function Chip({ children, dotColor, mono, className = "" }: ChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-hairline px-2 py-0.5 text-xs text-muted ${
        mono ? "font-mono" : ""
      } ${className}`}
    >
      {dotColor && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dotColor }} />}
      {children}
    </span>
  );
}