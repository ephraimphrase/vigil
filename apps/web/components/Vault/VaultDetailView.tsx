"use client";

// ─────────────────────────────────────────────────────────────
// VaultDetailView — composition only. Yearn-style single-vault page:
// breadcrumb → masthead → your position → a scroll-spy shell (Performance /
// Vault Info / Strategies / Risk / More Info) → deposit/withdraw rail,
// sticky on the right. The tab bar doesn't swap content - all five
// sections render stacked, clicking a tab scrolls to it, and the active
// tab follows scroll position via IntersectionObserver (useScrollSpy
// below). Headline APY, weighted health, and deployed total all come from
// vaultAggregate(vault.allocation) - this vault's own rows, not the global
// strategies list - so each vault in the picker shows its own numbers,
// never another vault's. No data logic of its own beyond that composition.
//
// Rendered from both /dashboard/vault/[slug] and the bare public
// /vault/[slug] route (see the thin wrappers there). No breadcrumb of its
// own - inside the dashboard shell that's AppShell's Breadcrumbs
// (components/Layouts/Breadcrumbs.tsx, which resolves this same vault's
// name for the last crumb); the bare public route has no dashboard nav to
// build one from, so it goes without.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";

import { useVault } from "@/hooks/useVault";
import { vaultAggregate } from "@/shared/vault";
import { Loader } from "@/components/ui/Loader";
import { Tabs } from "@/components/ui/Tabs";
import { VaultMasthead } from "@/components/Vault/VaultMasthead";
import { VaultPositionSummary } from "@/components/Vault/VaultPositionSummary";
import { VaultPerformanceChart } from "@/components/Vault/VaultPerformanceChart";
import { VaultInfoTab } from "@/components/Vault/VaultInfoTab";
import { VaultAllocation } from "@/components/Vault/VaultAllocation";
import { VaultRiskChecklist } from "@/components/Vault/VaultRiskChecklist";
import { VaultMoreInfo } from "@/components/Vault/VaultMoreInfo";
import { DepositWithdraw } from "@/components/Vault/DepositWithdraw";

type Tab = "deposit" | "withdraw";
type DetailTab = "performance" | "vault-info" | "strategies" | "risk" | "more-info";

const DETAIL_TABS: { id: DetailTab; label: string }[] = [
  { id: "performance", label: "Performance" },
  { id: "vault-info", label: "Vault Info" },
  { id: "strategies", label: "Strategies" },
  { id: "risk", label: "Risk" },
  { id: "more-info", label: "More Info" },
];
const SECTION_IDS = DETAIL_TABS.map((t) => t.id);

function scrollToSection(id: DetailTab) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Active tab tracks whichever section is currently at the top of the
// viewport, not which one was last clicked - clicking just scrolls there.
// `ready` gates the effect: VaultDetailView calls this hook before its
// isLoading/not-found early returns (hooks can't be conditional), so on
// first mount the <section> elements don't exist in the DOM yet - without
// `ready`, the observer would attach to nothing and never re-attach once
// the real content (and its section ids) actually renders.
function useScrollSpy(ids: DetailTab[], ready: boolean): DetailTab {
  const [active, setActive] = useState<DetailTab>(ids[0] ?? "performance");

  useEffect(() => {
    if (!ready) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const topmost = visible.reduce((a, b) => (a.boundingClientRect.top <= b.boundingClientRect.top ? a : b));
        setActive(topmost.target.id as DetailTab);
      },
      { rootMargin: "-96px 0px -60% 0px", threshold: 0 },
    );
    const elements = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids, ready]);

  return active;
}

export function VaultDetailView({ slug, onSubmit }: { slug: string; onSubmit?: (tab: Tab, amount: number) => void }) {
  const { data: vault, isLoading } = useVault(slug);
  const activeTab = useScrollSpy(SECTION_IDS, !isLoading && vault != null);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-base p-4">
        <Loader />
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 bg-base p-4">
        <span className="font-mono text-xs uppercase tracking-wider text-muted">Not found</span>
        <span className="text-sm text-muted/60">No vault matches &quot;{slug}&quot;.</span>
      </div>
    );
  }

  console.log(vault, "vault info")

  const { info, policy, position, allocation, riskChecks, history } = vault;
  const agg = vaultAggregate(allocation);

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-4 bg-base p-4">
      <VaultMasthead info={info} policy={policy} position={position} apy={agg.weightedApy} />

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* main column */}
        <div className="flex min-w-0 flex-col gap-4">
          <VaultPositionSummary info={info} position={position} deployed={agg.deployed} />

          <div className="rounded-none border border-hairline bg-panel/20">
            <div className="sticky top-0 z-10 bg-panel">
              <Tabs tabs={DETAIL_TABS} active={activeTab} onChange={scrollToSection} className="px-4" />
            </div>

            <section id="performance" className="scroll-mt-16 border-b border-hairline/60 p-4">
              <VaultPerformanceChart history={history} />
            </section>
            <section id="vault-info" className="scroll-mt-16 border-b border-hairline/60 p-4">
              <VaultInfoTab info={info} />
            </section>
            <section id="strategies" className="scroll-mt-16 border-b border-hairline/60 p-4">
              <VaultAllocation rows={allocation} />
            </section>
            <section id="risk" className="scroll-mt-16 border-b border-hairline/60 p-4">
              <VaultRiskChecklist rows={riskChecks} />
            </section>
            <section id="more-info" className="scroll-mt-16 p-4">
              <VaultMoreInfo info={info} />
            </section>
          </div>
        </div>

        {/* action rail */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <DepositWithdraw info={info} position={position} onSubmit={onSubmit} />
        </div>
      </div>
    </div>
  );
}
