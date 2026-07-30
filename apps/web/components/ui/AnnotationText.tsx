import type { ReactNode } from "react";

// DESIGN.md §3: annotation/tooltip copy fades into the dark, like ink
// running out. One definition so every InfoTooltip that wants this
// treatment shares it instead of each call site re-typing the gradient.
export function AnnotationText({ children }: { children: ReactNode }) {
  return (
    <span className="bg-gradient-to-b from-white to-[#55416E] to-60% bg-clip-text text-transparent">
      {children}
    </span>
  );
}
