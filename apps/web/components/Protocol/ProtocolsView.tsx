"use client";

// ─────────────────────────────────────────────────────────────
// ProtocolsView — composition only. Wires the table hook to header /
// toolbar / table. Shared between the public /protocols route (no
// dashboard chrome) and /dashboard/protocols (rendered inside AppShell)
// so the two never drift apart - see app/protocols/page.tsx and
// app/dashboard/protocols/page.tsx, which are both thin wrappers around
// this.
//
// Data: fetched from /api/protocols - no mock import here, so the raw
// dataset never ships in the client bundle.
// ─────────────────────────────────────────────────────────────

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { useApi } from "@/hooks/useApi";
import { useProtocolsTable } from "@/hooks/useProtocolsTable";
import type { ProtocolRow } from "@/types";
import { CornerFrame } from "@/components/ui/CornerFrame";
import { ProtocolsHeader } from "@/components/Protocol/ProtocolsHeader";
import { ProtocolsToolbar } from "@/components/Protocol/ProtocolsToolbar";
import { ProtocolsTable } from "@/components/Protocol/ProtocolsTable";

interface ProtocolsViewProps {
  // Detail links resolve to `${basePath}/${id}` - pass "/dashboard/protocols"
  // when rendering inside the dashboard shell so drilling into a protocol
  // doesn't drop the sidebar.
  basePath?: string;
}

export function ProtocolsView({ basePath = "/protocols" }: ProtocolsViewProps) {
  const router = useRouter();
  const { data: protocols, isLoading } = useApi<ProtocolRow[]>("/api/protocols", []);
  const onOpenProtocol = useCallback(
    (id: string) => router.push(`${basePath}/${id}`),
    [router, basePath]
  );

  const { table, rawQuery, setRawQuery, query, visibleCount, totalCount } = useProtocolsTable({
    data: protocols,
  });

  return (
    <div className="flex h-full flex-col gap-4 bg-base p-4">
      <ProtocolsHeader visibleCount={visibleCount} totalCount={totalCount} />
      <ProtocolsToolbar query={rawQuery} onQueryChange={setRawQuery} />
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
