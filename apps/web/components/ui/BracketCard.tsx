import type { ReactNode } from "react";

const L = "pointer-events-none absolute h-2.5 w-2.5 border-hairline";

export function BracketCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-none p-px ${className}`}>
      <span className={`${L} left-0 top-0 border-l border-t`} />
      <span className={`${L} right-0 top-0 border-r border-t`} />
      <span className={`${L} bottom-0 left-0 border-b border-l`} />
      <span className={`${L} bottom-0 right-0 border-b border-r`} />
      {children}
    </div>
  );
}