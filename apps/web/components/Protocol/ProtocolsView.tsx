"use client";

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
