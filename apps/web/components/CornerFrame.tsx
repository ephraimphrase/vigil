import type { ReactNode } from "react";

const DOT =
  "absolute h-3 w-3 rounded-full bg-[#9F95AB] shadow-[0_0_3.76px_0_#9259DA]";

interface CornerFrameProps {
  children: ReactNode;
  className?: string;
}

export function CornerFrame({ children, className = "" }: CornerFrameProps) {
  return (
    <div
      className={`relative rounded-none border border-[#CAC0D5]/20 bg-surface/40 ${className}`}
    >
      <span className={`${DOT} -top-1.5 -left-1.5`} />
      <span className={`${DOT} -top-1.5 -right-1.5`} />
      <span className={`${DOT} -bottom-1.5 -left-1.5`} />
      <span className={`${DOT} -bottom-1.5 -right-1.5`} />
      {children}
    </div>
  );
}