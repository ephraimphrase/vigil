"use client";

import { useCallback, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { CornerFrame } from "@/components/ui/CornerFrame";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Loader } from "@/components/ui/Loader";
import { WalletNotConnected } from "@/components/Wallet/WalletNotConnected";
import { TokenBalanceRow } from "@/components/Wallet/TokenBalanceRow";
import { useFaucetModal } from "@/components/Wallet/FaucetModalProvider";
import { useDepositableTokens } from "@/hooks/useDepositableTokens";
import { useLazyReveal } from "@/hooks/useLazyReveal";
import { fmtAddress } from "@/shared/format";

export default function WalletPage() {
  const account = useActiveAccount();
  const { tokens, isLoading: tokensLoading } = useDepositableTokens();
  const { openFaucet } = useFaucetModal();
  const [balances, setBalances] = useState<Record<string, number | null>>({});
  const { count: visibleCount, sentinelRef, hasMore } = useLazyReveal(tokens.length);

  const onBalance = useCallback((address: string, balance: number | null) => {
    setBalances((prev) => (prev[address] === balance ? prev : { ...prev, [address]: balance }));
  }, []);

  if (!account) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <WalletNotConnected message="Connect a wallet to see the test tokens you can deposit." />
      </div>
    );
  }

  const heldCount = tokens.filter((t) => (balances[t.address] ?? 0) > 0).length;
  const coveragePct = tokens.length > 0 ? (heldCount / tokens.length) * 100 : 0;

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-4 p-4">
      <CornerFrame>
        <div className="flex flex-col gap-6 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-violet-bright">
              <span className="h-1.5 w-1.5 rounded-full bg-violet" />
              Wallet
            </span>
            <p className="mt-1.5 font-mono text-lg text-body">{fmtAddress(account.address, 8, 6)}</p>
            <p className="mt-0.5 text-xs text-muted/60">Base Sepolia</p>
          </div>

          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
            <div className="flex w-48 flex-col gap-1.5">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-2xl tabular-nums text-body">
                  {heldCount}
                  <span className="text-sm text-muted/50">/{tokens.length}</span>
                </span>
                <span className="flex items-center gap-1 font-mono text-xs uppercase tracking-wider text-muted/60">
                  claimed
                  <InfoTooltip>
                    Test tokens with a nonzero balance in this wallet, out of every token a live vault currently
                    accepts as a deposit asset.
                  </InfoTooltip>
                </span>
              </div>
              <div className="h-1.5 w-full bg-hairline/20">
                <div className="h-full bg-violet/70 transition-all" style={{ width: `${coveragePct}%` }} />
              </div>
            </div>

            <button
              type="button"
              onClick={openFaucet}
              className="shrink-0 rounded-full bg-gradient-to-br from-violet-bright to-violet px-5 py-2 font-mono text-xs uppercase tracking-wider text-white transition-opacity hover:opacity-90"
            >
              Get test tokens
            </button>
          </div>
        </div>
      </CornerFrame>

      <section className="rounded-none border border-hairline bg-panel/20">
        <header className="border-b border-hairline px-4 py-3">
          <span className="font-mono text-xs uppercase tracking-wider text-muted">Depositable tokens</span>
        </header>
        {tokensLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader />
          </div>
        ) : tokens.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <span className="font-mono text-xs uppercase tracking-wider text-muted">No tokens yet</span>
            <span className="text-sm text-muted/60">No live vault accepts a test token as a deposit asset yet.</span>
          </div>
        ) : (
          <div className="max-h-[28rem] overflow-y-auto px-4">
            <ul className="divide-y divide-hairline/40">
              {tokens.map((t, i) => (
                <TokenBalanceRow key={t.address} token={t} onBalance={onBalance} render={i < visibleCount} />
              ))}
            </ul>
            {hasMore && (
              <div ref={sentinelRef} className="flex items-center justify-center py-3">
                <Loader className="scale-75" />
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
