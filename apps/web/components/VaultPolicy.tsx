// ─────────────────────────────────────────────────────────────
// VaultPolicy — this vault's rules. Pooled model: policy is READ-ONLY for
// depositors (governed by whoever runs the vault). Per-depositor tuning is
// a future tier; here you pick a vault whose policy fits.
// ─────────────────────────────────────────────────────────────

import { Chip } from "@/components/ui/Chip";
import { Section } from "@/components/Section";
import { fmtPct } from "@/shared/format";
import type { VaultPolicy as Policy } from "@/types";

// ─── UTILS ───
function Rule({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-sm tabular-nums text-body">{value}</span>
      <span className="font-mono text-xs uppercase tracking-wider text-muted/60">{label}</span>
    </div>
  );
}

// ─── MAIN ───
export function VaultPolicy({ policy }: { policy: Policy }) {
  return (
    <Section title="Policy" aside={<Chip mono>{policy.name}</Chip>}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Rule label="Max / protocol" value={fmtPct(policy.maxWeightPerProtocol)} />
          <Rule label="Exit floor" value={`< ${policy.exitFloorScore}`} />
          <Rule label="Cooldown" value={`${policy.cooldownHours}h`} />
          <Rule label="Autonomy" value={policy.autonomyDefault} />
        </div>
        {policy.excludedProtocols.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-hairline/60 pt-3">
            <span className="font-mono text-xs uppercase tracking-wider text-muted/60">Excluded</span>
            {policy.excludedProtocols.map((p) => <Chip key={p} mono>{p}</Chip>)}
          </div>
        )}
      </div>
    </Section>
  );
}
