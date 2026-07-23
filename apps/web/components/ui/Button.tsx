import type { ReactNode } from "react";
import { BiRightArrowAlt } from "react-icons/bi";

// ─── TYPES ─────────────────────────────────────
type ButtonVariant = "primary" | "ghost";

interface ButtonProps {
  href: string;
  variant?: ButtonVariant;
  icon?: boolean;
  className?: string;
  children: ReactNode;
}

// ─── CONSTANTS ─────────────────────────────────────
const PRIMARY_CLASSES =
  "bg-gradient-to-br from-violet-bright to-violet text-bg hover:shadow-[0_8px_28px_rgba(176,108,225,0.35)]";

// ─── SUBCOMPONENTS ─────────────────────────────────
function ArrowBubble() {
  return (
    <span className="ml-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-text text-violet transition-transform duration-300 group-hover:rotate-45">
      <BiRightArrowAlt className="h-4 w-4 -rotate-45" />
    </span>
  );
}

// ─── COMPONENT ─────────────────────────────────────
export function Button({ href, variant = "primary", icon = false, className, children }: ButtonProps) {
  if (variant === "ghost") {
    // ── wrapper-div technique: outer <a> IS the gradient — it's just a 1px
    // padding box with a gradient background, no border/mask/clip involved.
    // The inner <span> is a solid fill sitting on top, 1px smaller on every
    // side, which is what actually reads as "the button". Because both use
    // rounded-full, the inner pill's radius auto-adjusts to its own
    // (slightly smaller) height, so the ring stays an even 1px all the way
    // around the curved ends too. ──
    return (
      <a
        href={href}
        className={`group inline-flex rounded-full p-px transition-transform hover:-translate-y-px [background:linear-gradient(135deg,#D9B2EF,#412D4F)] ${className ?? ""}`}
      >
        <span
          className={`inline-flex items-center gap-2 rounded-full bg-black py-3.5 pl-6 font-body text-sm font-bold text-text transition-colors group-hover:bg-[rgba(150,104,183,0.16)] ${icon ? "pr-2" : "pr-6"}`}
        >
          {children}
          {icon && <ArrowBubble />}
        </span>
      </a>
    );
  }

  return (
    <a
      href={href}
      className={`group inline-flex items-center gap-2 rounded-full py-3.5 pl-6 font-body text-sm font-bold transition-transform hover:-translate-y-px ${icon ? "pr-2" : "pr-6"} ${PRIMARY_CLASSES} ${className ?? ""}`}
    >
      {children}
      {icon && <ArrowBubble />}
    </a>
  );
}