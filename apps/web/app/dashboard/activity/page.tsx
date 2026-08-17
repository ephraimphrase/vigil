"use client";

import { useMemo, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useActivity } from "@/hooks/useActivity";
import { useActivityTable } from "@/hooks/useActivityTable";
import { useTransactions } from "@/hooks/useTransactions";
import { useTransactionsTable } from "@/hooks/useTransactionsTable";
import { ALL_KINDS } from "@/shared/activity";
import { ActivityHeader } from "@/components/Activity/ActivityHeader";
import { ActivityTimeline } from "@/components/Activity/ActivityTimeline";
import { TransactionsHeader } from "@/components/Activity/TransactionsHeader";
import { TransactionsList } from "@/components/Activity/TransactionsList";
import { Tabs } from "@/components/ui/Tabs";
import { WalletNotConnected } from "@/components/Wallet/WalletNotConnected";

type View = "log" | "transactions";

export default function ActivityPage() {
  const [view, setView] = useState<View>("log");
  const account = useActiveAccount();

  const { data: activityData, isLoading: activityLoading } = useActivity();
  const { data: txData, isLoading: txLoading } = useTransactions();

  const myTxEntries = useMemo(() => {
    if (!account) return [];
    const addr = account.address.toLowerCase();
    return txData.entries.filter((e) => e.sender === addr);
  }, [txData.entries, account]);

  const protocolIds = useMemo(
    () => Array.from(new Set(activityData.entries.map((e) => e.protocolId).filter((id): id is string => Boolean(id)))).sort(),
    [activityData.entries]
  );
  const chains = useMemo(
    () => Array.from(new Set(myTxEntries.map((e) => e.chain))).sort(),
    [myTxEntries]
  );

  const {
    table: activityTable, activeKinds, setActiveKinds, protocolFilter, setProtocolFilter,
    datePreset, setDatePreset, visibleCount: activityVisibleCount, totalCount: activityTotalCount,
  } = useActivityTable(activityData.entries, ALL_KINDS);
  const visibleActivityEntries = activityTable.getRowModel().rows.map((r) => r.original);

  const {
    table: txTable, chainFilter, setChainFilter, typeFilter, setTypeFilter,
    dateRange, setDateRange, query, setQuery,
    visibleCount: txVisibleCount, totalCount: txTotalCount,
  } = useTransactionsTable(myTxEntries);
  const visibleTxEntries = txTable.getRowModel().rows.map((r) => r.original);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-1">
        <span className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-violet-bright">
          <span className="h-1.5 w-1.5 rounded-full bg-violet" /> Activity
        </span>
        <h1 className="font-display text-2xl leading-none tracking-tight text-body">Activity.</h1>
      </div>

      <Tabs
        tabs={[{ id: "log", label: "Log" }, { id: "transactions", label: "Transactions" }]}
        active={view}
        onChange={setView}
      />

      {view === "log" ? (
        <>
          <ActivityHeader
            allKinds={ALL_KINDS}
            activeKinds={activeKinds}
            onActiveKindsChange={setActiveKinds}
            protocolIds={protocolIds}
            protocolFilter={protocolFilter}
            onProtocolFilterChange={setProtocolFilter}
            datePreset={datePreset}
            onDatePresetChange={setDatePreset}
            visibleEntries={visibleActivityEntries}
            visibleCount={activityVisibleCount}
            totalCount={activityTotalCount}
          />
          <div className="border border-hairline">
            <ActivityTimeline table={activityTable} isLoading={activityLoading} />
          </div>
        </>
      ) : !account ? (
        <div className="border border-hairline">
          <WalletNotConnected message="Connect a wallet to see your deposits and withdrawals." />
        </div>
      ) : (
        <>
          <TransactionsHeader
            chains={chains}
            chainFilter={chainFilter}
            onChainFilterChange={setChainFilter}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            query={query}
            onQueryChange={setQuery}
            visibleEntries={visibleTxEntries}
            visibleCount={txVisibleCount}
            totalCount={txTotalCount}
          />
          <div className="border border-hairline">
            <TransactionsList table={txTable} isLoading={txLoading} />
          </div>
        </>
      )}
    </div>
  );
}
