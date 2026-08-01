"use client";

import NextLink from "next/link";

import { useOverview } from "@/hooks/useOverview";
import { PortfolioSummary } from "@/components/Overview/PortfolioSummary";
import { MyProtocols } from "@/components/Overview/MyProtocols";
import { EventFeed } from "@/components/Overview/EventFeed";

export default function DashboardOverviewPage() {
  const { data, isLoading } = useOverview();
  const { portfolio, positions, events } = data;

  return (
    <div className="grid gap-4 p-4 lg:grid-cols-[1fr_360px]">
      <div className="flex min-w-0 flex-col gap-4">
        <PortfolioSummary portfolio={portfolio} positions={positions} />
        <MyProtocols positions={positions} isLoading={isLoading} Link={NextLink} />
      </div>
      <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-8rem)]">
        <EventFeed initial={events} isLoading={isLoading} />
      </div>
    </div>
  );
}
