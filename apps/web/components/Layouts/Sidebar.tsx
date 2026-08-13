

import type { ComponentType, ReactNode } from "react";
import Image from "next/image";
import { PiHouseLight, PiXLight } from "react-icons/pi";
import { NAV, isActive } from "./nav.config";

type LinkLike = ComponentType<{ href: string; className?: string; children: ReactNode }>;

interface SidebarProps {
  pathname: string;
  badges?: { approvals?: number };
  Link?: LinkLike;
  /** Mobile drawer state - ignored at `md:` and up, where the sidebar is always visible and static. */
  open: boolean;
  onClose: () => void;
}

const DefaultLink: LinkLike = ({ href, className, children }) => (
  <a href={href} className={className}>{children}</a>
);

export function Sidebar({ pathname, badges, Link = DefaultLink, open, onClose }: SidebarProps) {
  return (
    <>
      {/* Backdrop - mobile only, dismisses the drawer on tap outside it. */}
      {open && (
        <div
          onClick={onClose}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-bg/70 md:hidden"
        />
      )}

      <aside
        onClick={onClose}
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-56 shrink-0 -translate-x-full flex-col border-r border-hairline bg-base transition-transform duration-200 md:static md:z-auto md:translate-x-0 ${
          open ? "translate-x-0" : ""
        }`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-hairline px-5 py-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="" width={24} height={24} className="h-6 w-6 shrink-0" priority />
            <span className="font-display text-lg tracking-tight text-body">Vigil</span>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            aria-label="Close menu"
            className="flex h-7 w-7 items-center justify-center text-muted transition-colors hover:text-body md:hidden"
          >
            <PiXLight className="h-5 w-5" />
          </button>
        </div>

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
                      <span className="flex items-center gap-2">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </span>
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

      <div className="border-t border-hairline px-3 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-none py-1.5 pl-3 pr-2 text-sm text-muted transition-colors hover:text-body"
        >
          <PiHouseLight className="h-4 w-4" />
          Homepage
        </Link>
      </div>
      </aside>
    </>
  );
}
