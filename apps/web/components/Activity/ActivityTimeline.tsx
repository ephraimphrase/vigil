import { PiScrollLight } from "react-icons/pi";
import type { Table } from "@tanstack/react-table";
import { ActivityRow } from "@/components/Activity/ActivityRow";
import { EmptyState } from "@/components/EmptyState";
import { Loader } from "@/components/ui/Loader";
import type { ActivityEntry } from "@/types";

interface ActivityTimelineProps {
  table: Table<ActivityEntry>;
  isLoading: boolean;
}

export function ActivityTimeline({ table, isLoading }: ActivityTimelineProps) {
  const rows = table.getRowModel().rows;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        query=""
        label="activity"
        icon={PiScrollLight}
        message="Nothing matches the current filters."
      />
    );
  }

  return (
    <ul className="flex flex-col">
      {rows.map((row) => <ActivityRow key={row.original.id} entry={row.original} />)}
    </ul>
  );
}
