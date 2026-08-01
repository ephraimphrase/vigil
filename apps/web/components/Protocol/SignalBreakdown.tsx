
import { Section } from "../Section";
import { Chip } from "@/components/ui/Chip";
import { fmtPct, trendArrow } from "@/shared/format";
import type { Category, Signal, SignalGroups } from "../../types";

const TYPED_LABEL: Record<Category, string> = {
  rollup: "Rollup signals", lending: "Lending signals", dex: "DEX signals",
  lsd: "Staking signals", cdp: "Stablecoin signals",
};
const STATUS_DOT: Record<Signal["status"], string | undefined> = {
  live: "#5FD08A", derived: "#B7DE5F", manual: "#9F95AB", unavailable: "#E0607F",
};

function SignalRow({ s }: { s: Signal }) {
  return (
    <div className="grid grid-cols-[minmax(120px,1.4fr)_minmax(90px,1fr)_80px_44px_auto] items-center gap-3 py-2">
      <span className="truncate text-sm text-body">{s.label}</span>
      <span className="truncate font-mono text-xs text-muted">{s.raw}{s.unit ? "" : ""}</span>
      <div className="h-1 w-full rounded-none bg-hairline/20">
        <div className="h-full bg-violet/70" style={{ width: `${Math.round(s.normalized * 100)}%` }} />
      </div>
      <span className="text-right font-mono text-xs text-muted/60" title="weight">{fmtPct(s.weight)}</span>
      <div className="flex items-center gap-2 justify-self-end">
        <span className="font-mono text-xs text-muted/50">{trendArrow(s.trend)}</span>
        <Chip mono dotColor={STATUS_DOT[s.status]}>{s.source}</Chip>
      </div>
    </div>
  );
}

function Group({ label, signals }: { label: string; signals: Record<string, Signal> }) {
  const rows = Object.entries(signals);
  if (rows.length === 0) return null;
  return (
    <div>
      <div className="mb-1 font-mono text-xs uppercase tracking-wider text-muted/60">{label}</div>
      <div className="divide-y divide-hairline/40">
        {rows.map(([k, s]) => <SignalRow key={k} s={s} />)}
      </div>
    </div>
  );
}

export function SignalBreakdown({ signals, category }: { signals: SignalGroups; category: Category }) {
  return (
    <Section title="Signal breakdown"
             aside={<span className="font-mono text-xs text-muted/50">value · weight · source</span>}>
      <div className="space-y-5">
        <Group label="Onchain" signals={signals.onchain} />
        <Group label="Offchain" signals={signals.offchain} />
        <Group label={TYPED_LABEL[category]} signals={signals.typed} />
      </div>
    </Section>
  );
}