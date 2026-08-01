"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import NextLink from "next/link";

import { AppShell } from "@/components/Layouts/AppShell";
import { NAV, isActive } from "@/components/Layouts/nav.config";
import { ConnectWallet } from "@/components/Wallet/ConnectWallet";

function titleFor(pathname: string): string {
  for (const section of NAV) {
    for (const item of section.items) {
      if (isActive(item.href, pathname)) return item.label;
    }
  }
  return "Dashboard";
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [autoArmed, setAutoArmed] = useState(true);

  return (
    <AppShell
      pathname={pathname}
      title={titleFor(pathname)}
      systemState="running"
      autoArmed={autoArmed}
      onToggleAuto={() => setAutoArmed((v) => !v)}
      Link={NextLink}
      wallet={<ConnectWallet />}
    >
      {children}
    </AppShell>
  );
}
