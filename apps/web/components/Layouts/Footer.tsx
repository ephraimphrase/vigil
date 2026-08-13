import Image from "next/image";
import { PiArrowUpRightLight } from "react-icons/pi";

interface FooterLink {
    label: string;
    href: string;
  }

  const PRODUCT_LINKS: FooterLink[] = [
    { label: "How it works", href: "#pipeline" },
    { label: "Features", href: "#features" },
    { label: "Decision logic", href: "#decisions" },
    { label: "FAQ", href: "#faq" },
  ];

  const RESOURCE_LINKS: FooterLink[] = [
    { label: "GitHub", href: "https://github.com/ephraimphrase/vigil" },
    { label: "Telegram", href: "https://t.me/vigil_guard" },
    { label: "Substack", href: "https://vigilguardfi.substack.com" },
  ];
  
  export function Footer() {
    return (
      <footer className="border-t border-border py-16">
        <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
          <div className="mb-12 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <div className="mb-3.5 flex items-center gap-2.5 font-display text-lg font-extrabold tracking-wide">
                <Image src="/logo.png" alt="" width={24} height={24} className="h-6 w-6 shrink-0" />
                VIGIL
              </div>
              <p className="max-w-[280px] text-sm text-text-muted">
                Autonomous protocol health monitoring and portfolio rebalancing.
              </p>
            </div>
  
            <FooterCol title="Product" links={PRODUCT_LINKS} />
            <FooterCol title="Resources" links={RESOURCE_LINKS} external />
          </div>

          <div className="flex flex-wrap justify-between gap-2.5 border-t border-border pt-6 text-sm text-text-dim">
            <span>© 2026 Vigil.</span>
          </div>
        </div>
      </footer>
    );
  }

  function FooterCol({ title, links, external = false }: { title: string; links: FooterLink[]; external?: boolean }) {
    return (
      <div>
        <h4 className="mb-3.5 font-mono text-xs uppercase tracking-wide text-text-dim">{title}</h4>
        {links.map((l) => (
          <a
            key={l.label}
            href={l.href}
            {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
            className="footer-link mb-2.5 flex w-fit items-center gap-1 text-sm text-text-muted transition-colors hover:text-text"
          >
            {l.label}
            {external && <PiArrowUpRightLight className="h-3.5 w-3.5" />}
          </a>
        ))}
      </div>
    );
  }