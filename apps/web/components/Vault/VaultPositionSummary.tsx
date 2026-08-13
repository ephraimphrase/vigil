// ─────────────────────────────────────────────────────────────
// VaultPositionSummary — the connected wallet's slice of the pool, plus the
// pool-wide deployed-vs-idle split (idle is a valid state, not a problem
// to hide). Every stat here carries a tooltip - depositors need to
// understand shares/cost-basis/deployed-vs-idle before they trust the
// numbers, and labels/copy use `info.asset` rather than hardcoding
// "USDC" since this page also serves non-stablecoin vaults. `deployed`
// is passed in (derived once, in VaultDetailView, via
// vaultAggregate(vault.allocation) - this vault's own rows) rather than
// recomputed here from totalAssets - idle, so there is one formula for
// "deployed" per vault, not two that can drift.
// ─────────────────────────────────────────────────────────────

import { Section } from "@/components/Section";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { AnnotationText } from "@/components/ui/AnnotationText";
import { deltaColor } from "@/shared/health";
import { fmtUsd, fmtUsdFull, fmtSigned } from "@/shared/format";
import type { UserPosition, VaultInfo } from "@/types";

// null (price feed down, a live read still resolving) renders "-" rather
// than a fabricated $0 - matches YourPositions.tsx's same convention for
// the cross-vault summary.
const usd = (v: number | null) => (v != null ? fmtUsdFull(v) : "-");
const usdShort = (v: number | null) => (v != null ? fmtUsd(v) : "-");
const signed = (v: number | null) => (v != null ? fmtSigned(v) : "-");

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
            <div className="font-mono text-3xl leading-none tabular-nums text-body">{usd(position.valueUsd)}</div>
            <div className="mt-1 flex items-center gap-3 font-mono text-xs">
              <span className="text-muted/60">P&amp;L</span>
              <span style={position.pnlUsd != null ? { color: deltaColor(position.pnlUsd) } : undefined}>
                {signed(position.pnlUsd)}
              </span>
              <span className="flex items-center gap-1 text-muted/60">
                vs. no-op
                <InfoTooltip>
                  <AnnotationText>
                    What you&apos;d have if you&apos;d just held {info.asset} instead of depositing — the benchmark this vault has to beat to be worth the risk.
                  </AnnotationText>
                </InfoTooltip>
              </span>
              <span style={Number.isFinite(info.benchmarkDeltaPct) ? { color: deltaColor(info.benchmarkDeltaPct) } : undefined}>
                {Number.isFinite(info.benchmarkDeltaPct) ? fmtSigned(info.benchmarkDeltaPct, "%") : "-"}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            <Stat
              label="Vault shares"
              value={position.shares != null ? position.shares.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "-"}
              tooltip={`Shares are your claim on the pool, like fund units. Depositing mints shares at the current share price; withdrawing burns them back to ${info.asset}. Your share of the pool doesn't change just because the pool grows — only the share price does.`}
            />
            <Stat
              label="Share price"
              value={`$${info.sharePrice.toFixed(4)}`}
              tooltip={`1 share started worth 1 ${info.asset}. As the vault earns yield, the share price rises, so each share redeems for more ${info.asset} over time. It only falls if the vault loses money.`}
            />
            <Stat
              label="Cost basis"
              value={usdShort(position.costBasisUsd)}
              tooltip="Your net principal still in this vault — total deposits minus withdrawals, valued at today's price. Not necessarily your first deposit: it moves if you've added or pulled out money since."
            />
            <Stat
              label="Wallet balance"
              value={usdShort(position.walletUsdc)}
              tooltip={`${info.asset} sitting in your wallet, not yet deposited into this vault — the same balance the deposit form's "Available" reads.`}
            />
            <Stat
              label="Deployed"
              value={fmtUsd(deployed)}
              tooltip="This vault's total assets currently allocated across its strategies — pool-wide, across every depositor, not just your share."
            />
            <Stat
              label="Idle"
              value={Number.isFinite(info.idle) ? fmtUsd(info.idle) : "-"}
              tooltip={`This vault's own ${info.asset} sitting uninvested, not yet allocated to a strategy — pool-wide, not just your share. A safe, valid state, not a problem.`}
            />
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
