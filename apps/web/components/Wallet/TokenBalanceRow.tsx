"use client";


import { useEffect } from "react";
import { TokenIcon } from "@/components/Vault/TokenIcon";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import type { TestToken } from "@/lib/testTokens";

interface TokenBalanceRowProps {
  token: TestToken;
  onBalance?: (address: string, balance: number | null) => void;
  compact?: boolean;
  render?: boolean;
}

export function TokenBalanceRow({ token, onBalance, compact = false, render = true }: TokenBalanceRowProps) {
  const { balance, isLoading } = useTokenBalance(token.address);

  useEffect(() => {
    if (!isLoading) onBalance?.(token.address, balance);
  }, [balance, isLoading, token.address, onBalance]);

  if (!render) return null;

  return (
    <li className={`flex items-center justify-between gap-3 ${compact ? "py-1.5" : "px-3 py-2"}`}>
      <div className="flex min-w-0 items-center gap-2.5">
        <TokenIcon symbol={token.symbol} logoURI={token.logoURI} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm text-body">{token.symbol.toUpperCase()}</p>
          {!compact && <p className="truncate font-mono text-xs text-muted/50">{token.name}</p>}
        </div>
      </div>
      <span className="shrink-0 font-mono text-xs tabular-nums text-body">
        {isLoading ? "…" : (balance ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}
      </span>
    </li>
  );
}
