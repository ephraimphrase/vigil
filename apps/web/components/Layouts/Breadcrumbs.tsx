"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { NAV } from "@/components/Layouts/nav.config";

const NAV_LABELS = new Map(NAV.flatMap((section) => section.items).map((item) => [item.href, item.label]));

const VAULT_DETAIL_RE = /^\/dashboard\/vault\/([^/]+)$/;

function useVaultBreadcrumbName(pathname: string): string | null {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    const match = pathname.match(VAULT_DETAIL_RE);
    if (!match) {
      setName(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/vault/${match[1]}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setName(data?.info?.name ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return name;
}

function humanize(segment: string): string {
  return decodeURIComponent(segment)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function crumbsFor(pathname: string, overrides: Map<string, string>): { label: string; href: string }[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let href = "";

  for (const segment of segments) {
    href += `/${segment}`;
    if (segment === "dashboard") {
      crumbs.push({ label: "Dashboard", href });
      continue;
    }
    crumbs.push({ label: overrides.get(href) ?? NAV_LABELS.get(href) ?? humanize(segment), href });
  }

  return crumbs;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const vaultName = useVaultBreadcrumbName(pathname);
  const overrides = new Map(vaultName ? [[pathname, vaultName]] : []);
  const crumbs = crumbsFor(pathname, overrides);

  if (crumbs.length <= 1) return null;

  return (
    <Breadcrumb className="tw-breadcrumb px-4 pt-4">
      <BreadcrumbList>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span className="contents" key={crumb.href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<NextLink href={crumb.href}>{crumb.label}</NextLink>} />
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
