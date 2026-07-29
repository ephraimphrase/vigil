

import type { ComponentType, ReactNode } from "react";
import { NAV, isActive } from "../nav.config";

// ─── TYPES ───
type LinkLike = ComponentType<{ href: string; className?: string; children: ReactNode }>;

interface SidebarProps {
  pathname: string;
  badges?: { approvals?: number };
  Link?: LinkLike; // defaults to <a>; pass next/link in the app
}

// ─── MAIN ───
const DefaultLink: LinkLike = ({ href, className, children }) => (
  <a href={href} className={className}>{children}</a>
);

export function Sidebar({ pathname, badges, Link = DefaultLink }: SidebarProps) {
  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-hairline bg-base">
      {/* wordmark */}
      <div className="flex items-center gap-2 border-b border-hairline px-5 py-4">
        <span className="h-2 w-2 rounded-full bg-violet shadow-[0_0_4px_#9259DA]" />
        <span className="font-display text-lg tracking-tight text-body">Vigil</span>
      </div>

      {/* nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((section) => (
          <div key={section.label} className="mb-5">
            <div className="px-2 pb-2 font-mono text-xs uppercase tracking-wider text-muted/50">
              {section.label}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href, pathname);
                const badge = item.badgeKey ? badges?.[item.badgeKey] : undefined;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`relative flex items-center justify-between rounded-none py-1.5 pl-3 pr-2 text-sm transition-colors ${
                        active
                          ? "bg-panel/40 text-body"
                          : "text-muted hover:text-body"
                      }`}
                    >
                      {active && <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 bg-violet" />}
                      {item.label}
                      {badge != null && badge > 0 && (
                        <span className="rounded-full border border-hairline px-1.5 font-mono text-xs text-violet-bright">
                          {badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
