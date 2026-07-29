// ─────────────────────────────────────────────────────────────
// VaultPosition — the connected wallet's slice of the pool. The page's
// single corner-node frame. Handles the not-connected case.
// ─────────────────────────────────────────────────────────────

import { CornerFrame } from "@/components/ui/CornerFrame";
import { deltaColor } from "@/lib/health";
import { fmtUsdFull, fmtSigned } from "@/lib/format";
import type { UserPosition, VaultInfo } from "@/types";

// ─── UTILS ───
function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-sm tabular-nums text-body" style={color ? { color } : undefined}>{value}</span>
      <span className="font-mono text-xs uppercase tracking-wider text-muted/60">{label}</span>
    </div>
  );
}

// ─── MAIN ───
export function VaultPosition({ info, position }: { info: VaultInfo; position: UserPosition | null }) {
  return (
    <CornerFrame>
      <div className="flex flex-col gap-6 p-5">
        {position ? (
          <>
            <div>
              <div className="font-display text-4xl leading-none tracking-tight text-body">
                {fmtUsdFull(position.valueUsd)}
              </div>
              <div className="mt-1 flex items-center gap-3 font-mono text-xs">
                <span className="text-muted/60">P&amp;L</span>
                <span style={{ color: deltaColor(position.pnlUsd) }}>{fmtSigned(position.pnlUsd)}</span>
                <span className="text-muted/60">vs. no-op</span>
                <span style={{ color: deltaColor(info.benchmarkDeltaPct) }}>{fmtSigned(info.benchmarkDeltaPct, "%")}</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-6">
              <Stat label="Vault shares" value={position.shares.toLocaleString("en-US", { maximumFractionDigits: 0 })} />
              <Stat label="Share price" value={`$${info.sharePrice.toFixed(4)}`} />
              <Stat label="Cost basis" value={fmtUsdFull(position.costBasisUsd)} />
              <Stat label="Wallet USDC" value={fmtUsdFull(position.walletUsdc)} />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-start gap-2 py-4">
            <span className="font-mono text-xs uppercase tracking-wider text-muted">No position</span>
            <span className="text-sm text-muted/60">Connect a wallet to deposit into the {info.asset} vault.</span>
          </div>
        )}
      </div>
    </CornerFrame>
  );
}
