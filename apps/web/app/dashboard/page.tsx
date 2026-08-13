"use client";

import NextLink from "next/link";

import { PortfolioSummary } from "@/components/Overview/PortfolioSummary";
import { YourPositions } from "@/components/Overview/YourPositions";
import { WalletSummary } from "@/components/Overview/WalletSummary";

export default function DashboardOverviewPage() {
  return (
    <div className="grid gap-4 p-4 lg:grid-cols-[1fr_360px]">
      <div className="flex min-w-0 flex-col gap-4">
        <PortfolioSummary />
        <YourPositions Link={NextLink} />
      </div>
      <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-8rem)]">
        <WalletSummary Link={NextLink} />
      </div>
    </div>
  );
}
