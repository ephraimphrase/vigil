// ─────────────────────────────────────────────────────────────
// VaultPositionSummary — the connected wallet's slice of the pool, plus the
// pool-wide deployed-vs-idle split (idle USDC is a valid state, not a
// problem to hide). Share count/share price/vs-no-op get tooltips per the
// product brief - depositors need to understand shares before they trust
// the number. `deployed` is passed in (derived once, in VaultDetailView,
// from the same strategies aggregate StrategiesHeader uses) rather than
// recomputed here from totalAssets - idle, so there is one formula for
// "deployed" across the app, not two that can drift.
// ─────────────────────────────────────────────────────────────

import { Section } from "@/components/Section";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { AnnotationText } from "@/components/ui/AnnotationText";
import { deltaColor } from "@/shared/health";
import { fmtUsdFull, fmtSigned } from "@/shared/format";
import type { UserPosition, VaultInfo } from "@/types";

// ─── UTILS ───
function Stat({ label, value, color, tooltip }: { label: string; value: string; color?: string; tooltip?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-sm tabular-nums text-body" style={color ? { color } : undefined}>{value}</span>
      <span className="flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-muted/60">
        {label}
        {tooltip && <InfoTooltip><AnnotationText>{tooltip}</AnnotationText></InfoTooltip>}
      </span>
    </div>
  );
}

// ─── MAIN ───
interface VaultPositionSummaryProps {
  info: VaultInfo;
  position: UserPosition | null;
  deployed: number;
}

export function VaultPositionSummary({ info, position, deployed }: VaultPositionSummaryProps) {
  return (
    <Section title="Your position">
      {position ? (
        <div className="flex flex-col gap-6">
          <div>
            <div className="font-mono text-3xl leading-none tabular-nums text-body">{fmtUsdFull(position.valueUsd)}</div>
            <div className="mt-1 flex items-center gap-3 font-mono text-xs">
              <span className="text-muted/60">P&amp;L</span>
              <span style={{ color: deltaColor(position.pnlUsd) }}>{fmtSigned(position.pnlUsd)}</span>
              <span className="flex items-center gap-1 text-muted/60">
                vs. no-op
                <InfoTooltip>
                  <AnnotationText>
                    What you&apos;d have if you&apos;d just held {info.asset} instead of depositing — the benchmark this vault has to beat to be worth the risk.
                  </AnnotationText>
                </InfoTooltip>
              </span>
              <span style={{ color: deltaColor(info.benchmarkDeltaPct) }}>{fmtSigned(info.benchmarkDeltaPct, "%")}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            <Stat
              label="Vault shares"
              value={position.shares.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              tooltip="Shares are your claim on the pool, like fund units. Depositing mints shares at the current share price; withdrawing burns them back to USDC. Your share of the pool doesn't change just because the pool grows — only the share price does."
            />
            <Stat
              label="Share price"
              value={`$${info.sharePrice.toFixed(4)}`}
              tooltip="1 share started worth 1 USDC. As the vault earns yield, the share price rises, so each share redeems for more USDC over time. It only falls if the vault loses money."
            />
            <Stat label="Cost basis" value={fmtUsdFull(position.costBasisUsd)} />
            <Stat label="Wallet USDC" value={fmtUsdFull(position.walletUsdc)} />
            <Stat label="Deployed" value={fmtUsdFull(deployed)} />
            <Stat label="Idle (USDC)" value={fmtUsdFull(info.idle)} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-2 py-4">
          <span className="font-mono text-xs uppercase tracking-wider text-muted">No position</span>
          <span className="text-sm text-muted/60">Connect a wallet to deposit into the {info.asset} vault.</span>
        </div>
      )}
    </Section>
  );
}
