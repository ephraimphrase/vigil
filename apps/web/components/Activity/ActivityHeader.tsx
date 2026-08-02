// ─────────────────────────────────────────────────────────────
// ActivityHeader — the Log tab's filter row: kind chips, protocol select,
// date-range presets, export. Chips for kind (small fixed set, want
// multi-select at a glance); a native select for protocol (large set,
// single choice); plain hairline buttons for date presets - three
// different controls because they're three different shapes of choice,
// not one dropdown pattern stamped three times. Page title lives once in
// app/dashboard/activity/page.tsx, above both tabs.
// ─────────────────────────────────────────────────────────────

import { KIND_COLOR, KIND_LABEL, DATE_PRESETS, type DateRangePreset } from "@/shared/activity";
import { toCsv, toJson, downloadBlob } from "@/shared/activity";
import type { ActivityEntry, EventKind } from "@/types";

// ─── UTILS ───
function toggleKind(active: Set<EventKind>, kind: EventKind): Set<EventKind> {
  const next = new Set(active);
  if (next.has(kind)) next.delete(kind);
  else next.add(kind);
  return next;
}

// ─── MAIN ───
interface ActivityHeaderProps {
  allKinds: EventKind[];
  activeKinds: Set<EventKind>;
  onActiveKindsChange: (kinds: Set<EventKind>) => void;
  protocolIds: string[];
  protocolFilter: string;
  onProtocolFilterChange: (id: string) => void;
  datePreset: DateRangePreset;
  onDatePresetChange: (preset: DateRangePreset) => void;
  visibleEntries: ActivityEntry[];
  visibleCount: number;
  totalCount: number;
}

export function ActivityHeader({
  allKinds, activeKinds, onActiveKindsChange,
  protocolIds, protocolFilter, onProtocolFilterChange,
  datePreset, onDatePresetChange,
  visibleEntries, visibleCount, totalCount,
}: ActivityHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* kind chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        {allKinds.map((k) => {
          const active = activeKinds.has(k);
          return (
            <button
              key={k}
              onClick={() => onActiveKindsChange(toggleKind(activeKinds, k))}
              className="rounded-full border px-2.5 py-1 font-mono text-xs uppercase tracking-wider transition-colors"
              style={{
                borderColor: active ? KIND_COLOR[k] : "var(--color-hairline)",
                color: active ? KIND_COLOR[k] : "var(--color-muted)",
              }}
            >
              {KIND_LABEL[k]}
            </button>
          );
        })}
      </div>

      {/* protocol select */}
      <select
        value={protocolFilter}
        onChange={(e) => onProtocolFilterChange(e.target.value)}
        className="rounded-none border border-hairline bg-base px-2 py-1 font-mono text-xs uppercase tracking-wider text-body outline-none focus:border-violet"
      >
        <option value="all">All protocols</option>
        {protocolIds.map((id) => (
          <option key={id} value={id}>{id.charAt(0).toUpperCase() + id.slice(1)}</option>
        ))}
      </select>

      {/* date presets */}
      <div className="flex items-center gap-1">
        {DATE_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => onDatePresetChange(p.id)}
            className={`rounded-full border px-2.5 py-1 font-mono text-xs uppercase tracking-wider transition-colors ${
              datePreset === p.id ? "border-violet text-violet-bright" : "border-hairline text-muted hover:border-hairline/60"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      <span className="font-mono text-xs tabular-nums text-muted">{visibleCount} / {totalCount}</span>

      {/* export */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => downloadBlob("vigil-activity.csv", toCsv(visibleEntries), "text/csv")}
          className="rounded-full border border-hairline px-3 py-1 font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:border-violet hover:text-violet-bright"
        >
          Export CSV
        </button>
        <button
          onClick={() => downloadBlob("vigil-activity.json", toJson(visibleEntries), "application/json")}
          className="rounded-full border border-hairline px-3 py-1 font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:border-violet hover:text-violet-bright"
        >
          Export JSON
        </button>
      </div>
    </div>
  );
}
