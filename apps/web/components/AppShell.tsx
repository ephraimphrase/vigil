"use client";

import type { ComponentType, ReactNode } from "react";
import { Sidebar } from "./Layouts/Sidebar";
import { Topbar } from "./Layouts/Topbar";
import { Breadcrumbs } from "./Breadcrumbs";
import type { SystemState } from "./Layouts/StatusPill";

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
  return (
    <div className="flex h-screen bg-base text-body">
      <Sidebar pathname={pathname} badges={badges} Link={Link} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} systemState={systemState} autoArmed={autoArmed} onToggleAuto={onToggleAuto} wallet={wallet} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
}
