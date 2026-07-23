import type { ReactNode } from "react";

type ButtonVariant = "primary" | "ghost";

interface ButtonProps {
  href: string;
  variant?: ButtonVariant;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-br from-violet-bright to-violet text-bg hover:shadow-[0_8px_28px_rgba(176,108,225,0.35)]",
  ghost:
    "bg-transparent border border-border-strong text-text hover:border-violet-bright",
};

export function Button({ href, variant = "primary", children }: ButtonProps) {
  return (
    <a
      href={href}
      className={`inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-body text-sm font-bold transition-transform hover:-translate-y-px ${VARIANT_CLASSES[variant]}`}
    >
      {children}
    </a>
  );
}