
export interface NavItem {
  label: string;
  href: string;
  badgeKey?: "approvals"; 
}
export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV: NavSection[] = [
  {
    label: "Monitor",
    items: [
      { label: "Overview", href: "/dashboard" },
      { label: "Protocols", href: "/dashboard/protocols" },
      { label: "Strategies", href: "/dashboard/strategies" },
    ],
  },
  {
    label: "Manage",
    items: [
      { label: "Vault", href: "/dashboard/vault" },
      { label: "Automation", href: "/dashboard/automation" },
      { label: "Approvals", href: "/dashboard/approvals", badgeKey: "approvals" },
    ],
  },
  {
    label: "Log",
    items: [{ label: "Activity", href: "/dashboard/activity" }],
  },
];

export function isActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}
