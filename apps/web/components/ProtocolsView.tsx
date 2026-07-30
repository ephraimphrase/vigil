"use client";

// ─────────────────────────────────────────────────────────────
// ProtocolsView — composition only. Owns watchlist state (local for now),
// wires the table hook to header / toolbar / table. Shared between the
// public /protocols route (no dashboard chrome) and /dashboard/protocols
// (rendered inside AppShell) so the two never drift apart - see
// app/protocols/page.tsx and app/dashboard/protocols/page.tsx, which are
// both thin wrappers around this.
//
// Data: fetched from /api/protocols - no mock import here, so the raw
// dataset never ships in the client bundle.
// ─────────────────────────────────────────────────────────────

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import { useApi } from "@/hooks/useApi";
import { useProtocolsTable } from "@/hooks/useProtocolsTable";
import type { ProtocolRow } from "@/types";
import { CornerFrame } from "@/components/ui/CornerFrame";
import { ProtocolsHeader } from "@/components/ProtocolsHeader";
import { ProtocolsToolbar } from "@/components/ProtocolsToolbar";
import { ProtocolsTable } from "@/components/ProtocolsTable";

const isLoading = false;

interface ProtocolsViewProps {
  // Detail links resolve to `${basePath}/${id}` - pass "/dashboard/protocols"
  // when rendering inside the dashboard shell so drilling into a protocol
  // doesn't drop the sidebar.
  basePath?: string;
}

export function ProtocolsView({ basePath = "/protocols" }: ProtocolsViewProps) {
  const router = useRouter();
  const protocols = useApi<ProtocolRow[]>("/api/protocols", []);
  const onOpenProtocol = useCallback(
    (id: string) => router.push(`${basePath}/${id}`),
    [router, basePath]
  );

  // watchlist — local optimistic state; lift to persistence later
  const [watchlisted, setWatchlisted] = useState<Set<string>>(new Set());
  const toggleWatch = useCallback((id: string) => {
    setWatchlisted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const {
    table,
    rawQuery,
    setRawQuery,
    watchOnly,
    setWatchOnly,
    query,
    visibleCount,
    totalCount,
  } = useProtocolsTable({
    data: protocols,
    watchlisted,
    onToggleWatch: toggleWatch,
  });

  return (
    <div className="flex h-full flex-col gap-4 bg-base p-4">
      <ProtocolsHeader visibleCount={visibleCount} totalCount={totalCount} />
      <ProtocolsToolbar
        query={rawQuery}
        onQueryChange={setRawQuery}
        watchOnly={watchOnly}
        onWatchOnlyToggle={() => setWatchOnly((v) => !v)}
      />
      <CornerFrame className="min-h-0 flex-1">
        <div className="flex h-full flex-col" style={{ maxHeight: "calc(100vh - 220px)" }}>
          <ProtocolsTable
            table={table}
            query={query}
            isLoading={isLoading}
            onOpenProtocol={onOpenProtocol}
          />
        </div>
      </CornerFrame>
    </div>
  );
}
