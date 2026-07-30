"use client";

import { usePathname } from "next/navigation";
import { Nav } from "./Nav";

// The marketing nav's links are homepage anchors (#pipeline, #features, ...)
// that don't apply once you're in the app, so it's hidden there - the
// dashboard renders its own Sidebar/AppShell instead.
export function ConditionalNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard")) return null;
  return <Nav />;
}
