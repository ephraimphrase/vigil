import type { IconType } from "react-icons";
import {
  PiSquaresFourLight,
  PiStackLight,
  PiFlowArrowLight,
  PiVaultLight,
  PiScrollLight,
} from "react-icons/pi";

export interface NavItem {
  label: string;
  href: string;
  icon: IconType;
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
      { label: "Overview", href: "/dashboard", icon: PiSquaresFourLight },
      { label: "Vault", href: "/dashboard/vault", icon: PiVaultLight },
      { label: "Protocols", href: "/dashboard/protocols", icon: PiStackLight },
      { label: "Strategies", href: "/dashboard/strategies", icon: PiFlowArrowLight },
    ],
  },
  {
    label: "Log",
    items: [{ label: "Activity", href: "/dashboard/activity", icon: PiScrollLight }],
  },
];

export function isActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}
