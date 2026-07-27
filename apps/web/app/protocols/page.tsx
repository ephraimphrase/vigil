"use client";

// ─────────────────────────────────────────────────────────────
// ProtocolsPage — composition only. Owns watchlist state (local for now),
// wires the table hook to header / toolbar / table. No layout logic,
// no data shaping — those live in their own files.
//
// Data: mock imported directly (per decision). To go live, swap
// MOCK_PROTOCOLS for a hook returning { data, isLoading } — nothing else
// in this tree changes.
// ─────────────────────────────────────────────────────────────

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import { MOCK_PROTOCOLS } from "@/mocks/protocols";
import { useProtocolsTable } from "@/hooks/useProtocolsTable";
import { CornerFrame } from "@/components/ui/CornerFrame";
import { ProtocolsHeader } from "@/components/ProtocolsHeader";
import { ProtocolsToolbar } from "@/components/ProtocolsToolbar";
import { ProtocolsTable } from "@/components/ProtocolsTable";

const isLoading = false;

export default function ProtocolsPage() {
  const router = useRouter();
  const onOpenProtocol = useCallback(
    (id: string) => router.push(`/protocols/${id}`),
    [router]
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
    data: MOCK_PROTOCOLS,
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