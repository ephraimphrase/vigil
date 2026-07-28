
import { useState } from "react";
import { Section } from "./Section";
import { severityColor } from "@/lib/health";
import { dateShort } from "@/lib/format";
import type { ContractRef, Incident, Dependency } from "../types";

interface DeepPanelProps {
  contracts: ContractRef[];
  incidents: Incident[];
  dependencies: Dependency[];
}
type TabKey = "contracts" | "incidents" | "dependencies";

const shorten = (a: string) => (a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a);

function Contracts({ rows }: { rows: ContractRef[] }) {
  return (
    <ul className="divide-y divide-hairline/40">
      {rows.map((c, i) => (
        <li key={i} className="grid grid-cols-[1fr_auto_80px] items-center gap-3 py-2">
          <span className="text-sm text-body">{c.label}</span>
          <span className="font-mono text-xs text-muted">{shorten(c.address)}</span>
          <span className="justify-self-end font-mono text-xs uppercase tracking-wider text-muted/50">{c.kind}</span>
        </li>
      ))}
    </ul>
  );
}

function Incidents({ rows }: { rows: Incident[] }) {
  return (
    <ul className="space-y-3">
      {rows.map((n, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-0.5 h-full min-h-[2rem] w-0.5 shrink-0" style={{ backgroundColor: severityColor(n.severity) }} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted">{dateShort(n.ts)}</span>
              <span className="text-sm text-body">{n.title}</span>
              <span className="font-mono text-xs uppercase tracking-wider text-muted/50">{n.type}</span>
            </div>
            <p className="mt-0.5 text-sm text-muted">{n.note}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Dependencies({ rows }: { rows: Dependency[] }) {
  return (
    <ul className="divide-y divide-hairline/40">
      {rows.map((d, i) => (
        <li key={i} className="grid grid-cols-[80px_1fr] items-baseline gap-3 py-2">
          <span className="font-mono text-xs uppercase tracking-wider text-violet-bright">{d.type}</span>
          <div>
            <span className="text-sm text-body">{d.target}</span>
            <p className="mt-0.5 text-sm text-muted">{d.note}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ─── MAIN ───
export function DeepPanel({ contracts, incidents, dependencies }: DeepPanelProps) {
  const allTabs: { key: TabKey; label: string; count: number }[] = [
    { key: "contracts", label: "Contracts", count: contracts.length },
    { key: "incidents", label: "Incidents", count: incidents.length },
    { key: "dependencies", label: "Dependencies", count: dependencies.length },
  ];
  const tabs = allTabs.filter((t) => t.count > 0);

  const [active, setActive] = useState<TabKey | undefined>(tabs[0]?.key);
  if (tabs.length === 0) return null;

  return (
    <Section
      title="Details"
      aside={
        <div className="flex items-center gap-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={`font-mono text-xs uppercase tracking-wider transition-colors ${
                active === t.key ? "text-body" : "text-muted/60 hover:text-muted"
              }`}
            >
              {t.label} <span className="text-muted/40">{t.count}</span>
            </button>
          ))}
        </div>
      }
    >
      {active === "contracts" && <Contracts rows={contracts} />}
      {active === "incidents" && <Incidents rows={incidents} />}
      {active === "dependencies" && <Dependencies rows={dependencies} />}
    </Section>
  );
}