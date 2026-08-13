"use client";

import { useState, type ComponentType, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Breadcrumbs } from "./Breadcrumbs";
import type { SystemState } from "./StatusPill";

interface AppShellProps {
  pathname: string;
  title: string;
  systemState: SystemState;
  autoArmed: boolean;
  onToggleAuto: () => void;
  badges?: { approvals?: number };
  Link?: ComponentType<{ href: string; className?: string; children: ReactNode }>;
  wallet?: ReactNode;
  children: ReactNode;
}

export function AppShell({
  pathname, title, systemState, autoArmed, onToggleAuto, badges, Link, wallet, children,
}: AppShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-base text-body">
      <Sidebar
        pathname={pathname}
        badges={badges}
        Link={Link}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        systemState={systemState}
        autoArmed={autoArmed}
        onToggleAuto={onToggleAuto}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={title}
          systemState={systemState}
          autoArmed={autoArmed}
          onToggleAuto={onToggleAuto}
          wallet={wallet}
          onMenuClick={() => setMenuOpen(true)}
        />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}
