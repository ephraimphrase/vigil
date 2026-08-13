import Image from "next/image";

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
    { label: "Docs", href: "#" },
    { label: "GitHub", href: "#" },
    { label: "Audit trail", href: "#" },
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
            <FooterCol title="Resources" links={RESOURCE_LINKS} />
          </div>
  
          <div className="flex flex-wrap justify-between gap-2.5 border-t border-border pt-6 text-sm text-text-dim">
            <span>© 2026 Vigil.</span>
          </div>
        </div>
      </footer>
    );
  }
  
  function FooterCol({ title, links }: { title: string; links: FooterLink[] }) {
    return (
      <div>
        <h4 className="mb-3.5 font-mono text-xs uppercase tracking-wide text-text-dim">{title}</h4>
        {links.map((l) => (
          <a key={l.label} href={l.href} className="mb-2.5 block text-sm text-text-muted hover:text-text">
            {l.label}
          </a>
        ))}
      </div>
    );
  }