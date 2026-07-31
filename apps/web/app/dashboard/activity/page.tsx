"use client";

// ─────────────────────────────────────────────────────────────
// ActivityPage — the permanent, filterable execution audit trail. Not the
// Overview ticker (that's "what's happening now"); this is "everything
// that ever happened, with proof, filterable, exportable." No corner-node
// frame here - DESIGN.md rations that motif to 1-2 primary panels per
// view, and a dense reverse-chronological log is exactly the case it says
// may want none; a plain hairline border carries it instead.
// ─────────────────────────────────────────────────────────────

import { useMemo } from "react";
import { useActivity } from "@/hooks/useActivity";
import { useActivityTable } from "@/hooks/useActivityTable";
import { ALL_KINDS } from "@/shared/activity";
import { ActivityHeader } from "@/components/ActivityHeader";
import { ActivityTimeline } from "@/components/ActivityTimeline";

export default function ActivityPage() {
  const { data, isLoading } = useActivity();

  const protocolIds = useMemo(
    () => Array.from(new Set(data.entries.map((e) => e.protocolId).filter((id): id is string => Boolean(id)))).sort(),
    [data.entries]
  );

  const {
    table, activeKinds, setActiveKinds, protocolFilter, setProtocolFilter,
    datePreset, setDatePreset, visibleCount, totalCount,
  } = useActivityTable(data.entries, ALL_KINDS);

  const visibleEntries = table.getRowModel().rows.map((r) => r.original);

  return (
    <div className="flex flex-col gap-4 p-4">
      <ActivityHeader
        allKinds={ALL_KINDS}
        activeKinds={activeKinds}
        onActiveKindsChange={setActiveKinds}
        protocolIds={protocolIds}
        protocolFilter={protocolFilter}
        onProtocolFilterChange={setProtocolFilter}
        datePreset={datePreset}
        onDatePresetChange={setDatePreset}
        visibleEntries={visibleEntries}
        visibleCount={visibleCount}
        totalCount={totalCount}
      />
      <div className="border border-hairline">
        <ActivityTimeline table={table} isLoading={isLoading} />
      </div>
    </div>
  );
}
