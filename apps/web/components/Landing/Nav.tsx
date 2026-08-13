import Link from "next/link";
import { Button } from "../ui/Button";
import { MdOutlineArrowOutward } from "react-icons/md";



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
        <Link href="/" className="flex items-center gap-2.5 font-display text-lg font-extrabold tracking-wide">
          VIGIL
        </Link>

        <div className="hidden gap-9 text-sm text-[#E5DBF1] opacity-[80%] md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-text font-[300]">
              {l.label}
            </Link>
          ))}
        </div>

        <Button href="/dashboard" variant="ghost" className="uppercase " >Get Started <MdOutlineArrowOutward size={18} ></MdOutlineArrowOutward></Button>
      </div>
    </nav>
  );
}