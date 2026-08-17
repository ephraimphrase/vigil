import type { ReactNode } from "react";

export function AnnotationText({ children }: { children: ReactNode }) {
  return (
    <span className="bg-gradient-to-b from-white to-[#55416E] to-60% bg-clip-text text-transparent">
      {children}
    </span>
  );
}
