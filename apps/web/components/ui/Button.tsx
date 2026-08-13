import type { ReactNode } from "react";
import Link from "next/link";
import { BiRightArrowAlt } from "react-icons/bi";

type ButtonVariant = "primary" | "ghost";

interface ButtonProps {
  href: string;
  variant?: ButtonVariant;
  icon?: boolean;
  className?: string;
  children: ReactNode;
  /** Opens in a new tab with rel="noreferrer" - for links that leave the site (e.g. an external community/docs link). */
  external?: boolean;
}

const PRIMARY_CLASSES =
  "bg-gradient-to-br from-violet-bright to-violet text-white hover:shadow-[0_8px_28px_rgba(176,108,225,0.35)]";

function ArrowBubble() {
  return (
    <span className="ml-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-text text-violet transition-transform duration-300 group-hover:rotate-45">
      <BiRightArrowAlt className="h-6 w-6 -rotate-45" />
    </span>
  );
}

export function Button({ href, variant = "primary", icon = false, className, children, external = false }: ButtonProps) {
  const externalProps = external ? { target: "_blank", rel: "noreferrer" } : {};

  if (variant === "ghost") {

    return (
      <Link
        href={href}
        {...externalProps}
        className={`group inline-flex rounded-full p-px transition-transform hover:-translate-y-px [background:linear-gradient(135deg,#D9B2EF,#412D4F)] ${className ?? ""}`}
      >
        <span
          className={`inline-flex items-center gap-2 rounded-full bg-[#1e1425] py-1.5 pl-6 font-body text-sm font-normal uppercase text-text transition-colors  ${icon ? "pr-2" : "pr-6"}`}
        >
          {children}
          {icon && <ArrowBubble />}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      {...externalProps}
      className={`group inline-flex items-center gap-2 rounded-full py-1.5 pl-6 font-body text-sm font-normal uppercase transition-transform hover:-translate-y-px ${icon ? "pr-2" : "pr-6"} ${PRIMARY_CLASSES} ${className ?? ""}`}
    >
      {children}
      {icon && <ArrowBubble />}
    </Link>
  );
}