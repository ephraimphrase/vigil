// ─────────────────────────────────────────────────────────────
// YourPositions — one row per vault the connected wallet has actually
// deposited into (VaultSummary.positionValueUsd != null), value/pnl/apy/
// health at a glance, linking through to that vault's detail page.
// Distinct from MyProtocols: that panel is this vault's internal
// allocation across protocols; this one is the wallet's exposure across
// vaults, so a wallet with positions in more than one vault sees all of
// them here. Gated on wallet connection rather than data - the seed can
// carry a fake position, but a disconnected wallet has none, full stop.
// ─────────────────────────────────────────────────────────────

import type { ComponentType, ReactNode } from "react";
import { PiVaultLight } from "react-icons/pi";
import { ScoreCell } from "@/components/Health/ScoreCell";
import { TokenIconStack, ChainIcon } from "@/components/Vault/TokenIcon";
import { assetsOf } from "@/components/Vault/vaultFilters";
import { WalletNotConnected } from "@/components/Wallet/WalletNotConnected";
import { Loader } from "@/components/ui/Loader";
import { EmptyState } from "@/components/EmptyState";
import { deltaColor } from "@/shared/health";
import { fmtUsdFull, fmtSigned } from "@/shared/format";
import type { VaultSummary } from "../../types";

type LinkLike = ComponentType<{ href: string; className?: string; children: ReactNode }>;
const DefaultLink: LinkLike = ({ href, className, children }) => <a href={href} className={className}>{children}</a>;

interface YourPositionsProps {
  positions: VaultSummary[];
  isConnected: boolean;
  isLoading?: boolean;
  Link?: LinkLike;
}

export function YourPositions({ positions, isConnected, isLoading = false, Link = DefaultLink }: YourPositionsProps) {
  return (
    <section className="rounded-none border border-hairline bg-panel/20">
      <header className="flex items-center justify-between border-b border-hairline px-4 py-2">
        <span className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-violet-bright">
          <span className="h-1.5 w-1.5 rounded-full bg-violet" /> Your positions
        </span>
        <span className="flex items-center gap-1.5 font-mono text-xs text-muted/50">
          <span>value</span>
          <span>·</span>
          <span>pnl</span>
          <span>·</span>
          <span>apy</span>
          <span>·</span>
          <span>health</span>
        </span>
      </header>
      {!isConnected ? (
        <WalletNotConnected message="Connect a wallet to see which vaults you're deposited into." />
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader />
        </div>
      ) : positions.length === 0 ? (
        <EmptyState query="" label="positions" icon={PiVaultLight} message="No positions yet — deposit into a vault to see it here." />
      ) : (
        <ul className="divide-y divide-hairline/40">
          {positions.map((v) => (
            <li key={v.slug}>
              <Link
                href={`/dashboard/vault/${v.slug}`}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-4 py-3 transition-colors hover:bg-panel/40"
              >
                <div className="flex items-center gap-3">
                  <TokenIconStack symbols={assetsOf(v)} logoURIs={[v.assetLogoURI]} size="md" />
                  <div className="flex flex-col">
                    <span className="text-sm text-body">{v.name}</span>
                    <span className="flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-muted/50">
                      <ChainIcon chain={v.chain} />
                      {v.chain}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-mono text-sm tabular-nums text-body">{fmtUsdFull(v.positionValueUsd ?? 0)}</span>
                  <span className="font-mono text-xs tabular-nums" style={{ color: deltaColor(v.positionPnlUsd ?? 0) }}>
                    {fmtSigned(v.positionPnlUsd ?? 0)}
                  </span>
                </div>
                <span className="w-14 text-right font-mono text-sm tabular-nums text-muted">{v.apy.toFixed(1)}%</span>
                <ScoreCell score={v.score} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
