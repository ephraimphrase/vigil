import { Button } from "../ui/Button";

// ─── TYPES ─────────────────────────────────────
interface NavLink {
  label: string;
  href: string;
}

// ─── CONSTANTS ─────────────────────────────────────
const NAV_LINKS: NavLink[] = [
  { label: "How it works", href: "#pipeline" },
  { label: "Features", href: "#features" },
  { label: "Decision logic", href: "#decisions" },
  { label: "FAQ", href: "#faq" },
];

// ─── COMPONENT ─────────────────────────────────────
export function Nav() {
  return (
    <nav className="sticky top-0 z-50  backdrop-blur-md">
      <div className="mx-auto flex h-[76px] max-w-[1180px] items-center justify-between px-5 sm:px-8">
        <div className="flex items-center gap-2.5 font-display text-lg font-extrabold tracking-wide">
          <span className="h-2 w-2 animate-pulse rounded-full bg-healthy shadow-[0_0_10px_var(--color-healthy)]" />
          VIGIL
        </div>

        <div className="hidden gap-9 text-sm text-[#E5DBF1] md:flex">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-text">
              {l.label}
            </a>
          ))}
        </div>

        <Button href="#" variant="ghost" icon>Get Started</Button>
      </div>
    </nav>
  );
}