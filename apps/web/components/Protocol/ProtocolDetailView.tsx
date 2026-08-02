"use client";

// ─────────────────────────────────────────────────────────────
// ProtocolDetailView — composition only, organized by depth tier:
//   GLANCE : Masthead + Assessment
//   SCAN   : Score chart · Signal breakdown · Risk · Triggers
//   DEEP   : Details (contracts/incidents/deps) · Ask
// A two-column grid keeps market/side context beside the main column on
// wide viewports; single column below. No data logic here.
//
// Shared between the public /protocols/[id] route (no dashboard chrome)
// and /dashboard/protocols/[id] (rendered inside AppShell) - see the two
// thin route wrappers that just resolve the id param and render this.
// ─────────────────────────────────────────────────────────────

import { useProtocolDetail } from "@/hooks/useProtocolsDetails";
import { Loader } from "@/components/ui/Loader";
import { Masthead } from "@/components/Protocol/MastHead";
import { HealthAssessment } from "@/components/Protocol/HealthAssessment";
import { ScoreChart } from "@/components/Protocol/ScoreChart";
import { SignalBreakdown } from "@/components/Protocol/SignalBreakdown";
import { RiskAnalysis } from "@/components/Protocol/RiskAnalysis";
import { TriggerHistory } from "@/components/Protocol/TriggerHistory";
import { DeepPanel } from "@/components/Protocol/DeepPanel";
import { AskPanel } from "@/components/Protocol/AskPanel";
import { MarketStrip } from "@/components/Protocol/MarketStrip";

export function ProtocolDetailView({ protocolId }: { protocolId: string }) {
  const { data: p, isLoading } = useProtocolDetail(protocolId);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-base">
        <Loader />
      </div>
    );
  }

  if (!p) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 bg-base">
        <span className="font-mono text-xs uppercase tracking-wider text-muted">Not found</span>
        <span className="text-sm text-muted/60">No protocol matches "{protocolId}".</span>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-4 bg-base p-4">
      {/* GLANCE */}
      <Masthead identity={p.identity} health={p.health} />
      {p.market && <MarketStrip market={p.market} />}
      <HealthAssessment health={p.health} />

      {/* SCAN */}
      <ScoreChart history={p.scoreHistory} />
      <SignalBreakdown signals={p.signals} category={p.identity.category} />
      <div className="grid gap-4 lg:grid-cols-2">
        <RiskAnalysis risk={p.risk} />
        <TriggerHistory triggers={p.triggers} />
      </div>

      {/* DEEP */}
      <DeepPanel contracts={p.contracts} incidents={p.incidents} dependencies={p.dependencies} />
      <AskPanel suggestions={p.askSuggestions} />
    </div>
  );
}
