"use client";

import NextLink from "next/link";
import { useActiveAccount } from "thirdweb/react";

import { useOverview } from "@/hooks/useOverview";
import { useApi } from "@/hooks/useApi";
import { PortfolioSummary } from "@/components/Overview/PortfolioSummary";
import { MyProtocols } from "@/components/Overview/MyProtocols";
import { YourPositions } from "@/components/Overview/YourPositions";
import { WalletSummary } from "@/components/Overview/WalletSummary";
import type { VaultSummary } from "@/types";

export default function DashboardOverviewPage() {
  const { data, isLoading } = useOverview();
  const { portfolio, positions } = data;
  const account = useActiveAccount();
  const { data: vaults, isLoading: vaultsLoading } = useApi<VaultSummary[]>("/api/vaults", []);
  const yourVaultPositions = vaults.filter((v) => v.positionValueUsd !== null);

  return (
    <div className="grid gap-4 p-4 lg:grid-cols-[1fr_360px]">
      <div className="flex min-w-0 flex-col gap-4">
        <PortfolioSummary portfolio={portfolio} positions={positions} />
        <YourPositions
          positions={yourVaultPositions}
          isConnected={!!account}
          isLoading={vaultsLoading}
          Link={NextLink}
        />
        <MyProtocols positions={positions} isLoading={isLoading} Link={NextLink} />
      </div>
      <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-8rem)]">
        <WalletSummary Link={NextLink} />
      </div>
    </div>
  );
}
