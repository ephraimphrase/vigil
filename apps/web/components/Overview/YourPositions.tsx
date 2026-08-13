"use client";

// ─────────────────────────────────────────────────────────────
// YourPositions — one row per vault the connected wallet currently holds a
// position in, value/pnl/apy/health at a glance (usePortfolio(), real -
// same source PortfolioSummary's headline reads), linking through to that
// vault's detail page. Distinct from MyProtocols: that panel is a single
// vault's internal allocation across protocols; this one is the wallet's
// exposure across vaults, so a wallet with positions in more than one
// vault sees all of them here.
// ─────────────────────────────────────────────────────────────

import type { ComponentType, ReactNode } from "react";
import { PiVaultLight } from "react-icons/pi";
import { TokenIcon } from "@/components/Vault/TokenIcon";
import { WalletNotConnected } from "@/components/Wallet/WalletNotConnected";
import { Loader } from "@/components/ui/Loader";
import { EmptyState } from "@/components/EmptyState";
import { usePortfolio } from "@/hooks/usePortfolio";
import { deltaColor } from "@/shared/health";
import { fmtUsdFull, fmtSigned } from "@/shared/format";

type LinkLike = ComponentType<{ href: string; className?: string; children: ReactNode }>;
const DefaultLink: LinkLike = ({ href, className, children }) => <a href={href} className={className}>{children}</a>;

export function YourPositions({ Link = DefaultLink }: { Link?: LinkLike }) {
  const { data, isLoading, connected } = usePortfolio();

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
        </span>
      </header>
      {!connected ? (
        <WalletNotConnected message="Connect a wallet to see which vaults you're deposited into." />
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader />
        </div>
      ) : data.positions.length === 0 ? (
        <EmptyState query="" label="positions" icon={PiVaultLight} message="No positions yet — deposit into a vault to see it here." />
      ) : (
        <ul className="divide-y divide-hairline/40">
          {data.positions.map((p) => (
            <li key={p.vaultSlug}>
              <Link
                href={`/dashboard/vault/${p.vaultSlug}`}
                className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-3 transition-colors hover:bg-panel/40"
              >
                <div className="flex items-center gap-3">
                  <TokenIcon symbol={p.asset} logoURI={p.assetLogoURI} size="md" />
                  <div className="flex flex-col">
                    <span className="text-sm text-body">{p.vaultName}</span>
                    <span className="font-mono text-xs uppercase tracking-wider text-muted/50">{p.asset}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-mono text-sm tabular-nums text-body">
                    {p.currentUsd != null ? fmtUsdFull(p.currentUsd) : "-"}
                  </span>
                  <span className="font-mono text-xs tabular-nums" style={{ color: deltaColor(p.pnlUsd ?? 0) }}>
                    {p.pnlUsd != null ? fmtSigned(p.pnlUsd) : "-"}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
