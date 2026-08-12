"use client";

import { useCallback, useState, type ComponentType, type ReactNode } from "react";
import { PiWalletLight } from "react-icons/pi";
import { useActiveAccount } from "thirdweb/react";
import { WalletNotConnected } from "@/components/Wallet/WalletNotConnected";
import { TokenBalanceRow } from "@/components/Wallet/TokenBalanceRow";
import { useFaucetModal } from "@/components/Wallet/FaucetModalProvider";
import { useDepositableTokens } from "@/hooks/useDepositableTokens";
import { fmtAddress } from "@/shared/format";

type LinkLike = ComponentType<{ href: string; className?: string; children: ReactNode }>;
const DefaultLink: LinkLike = ({ href, className, children }) => (
  <a href={href} className={className}>{children}</a>
);

export function WalletSummary({ Link = DefaultLink }: { Link?: LinkLike }) {
  const account = useActiveAccount();
  const { tokens } = useDepositableTokens();
  const { openFaucet } = useFaucetModal();
  const [balances, setBalances] = useState<Record<string, number | null>>({});

  const onBalance = useCallback((address: string, balance: number | null) => {
    setBalances((prev) => (prev[address] === balance ? prev : { ...prev, [address]: balance }));
  }, []);

  const heldCount = tokens.filter((t) => (balances[t.address] ?? 0) > 0).length;

  return (
    <section className="flex h-full flex-col rounded-none border border-hairline bg-panel/20">
      <header className="flex items-center justify-between border-b border-hairline px-4 py-2">
        <span className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-violet-bright">
          <PiWalletLight className="h-3.5 w-3.5" />
          Wallet
        </span>
        <Link href="/dashboard/wallet" className="font-mono text-xs text-muted transition-colors hover:text-body">
          View all &rarr;
        </Link>
      </header>

      {!account ? (
        <div className="flex flex-1 items-center justify-center">
          <WalletNotConnected message="Connect a wallet to see your tokens." />
        </div>
      ) : (
        <>
          <div className="border-b border-hairline/60 px-4 py-3">
            <p className="font-mono text-sm text-body">{fmtAddress(account.address, 6, 4)}</p>
            <div className="mt-2 flex items-center justify-between font-mono text-xs">
              <span className="text-muted/60">Tokens claimed</span>
              <span className="tabular-nums text-body">
                {heldCount}/{tokens.length}
              </span>
            </div>
            <div className="mt-1 h-1 w-full bg-hairline/20">
              <div
                className="h-full bg-violet/70 transition-all"
                style={{ width: `${tokens.length > 0 ? (heldCount / tokens.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4">
            <ul className="divide-y divide-hairline/30">
              {tokens.map((t) => (
                <TokenBalanceRow
                  key={t.address}
                  token={t}
                  onBalance={onBalance}
                  compact
                  render={(balances[t.address] ?? 0) > 0}
                />
              ))}
            </ul>
            {heldCount === 0 && (
              <div className="flex flex-col items-center justify-center gap-1 py-6 text-center">
                <span className="font-mono text-xs uppercase tracking-wider text-muted">No tokens yet</span>
                <span className="text-xs text-muted/60">Claim test tokens to get started.</span>
              </div>
            )}
          </div>

          <div className="border-t border-hairline p-3">
            <button
              type="button"
              onClick={openFaucet}
              className="w-full rounded-full bg-gradient-to-br from-violet-bright to-violet py-2 font-mono text-xs uppercase tracking-wider text-white transition-opacity hover:opacity-90"
            >
              Get test tokens
            </button>
          </div>
        </>
      )}
    </section>
  );
}
