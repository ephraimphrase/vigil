"use client";

// ─────────────────────────────────────────────────────────────
// DepositWithdraw — the action panel. Tabbed deposit / withdraw, quick-pick
// percent pills + amount, live preview. Amount math is pure (shared/vault),
// mirroring ERC4626 previewDeposit/previewRedeem. Submit is a stub - wire
// to approve+deposit / redeem later. Amount field is the coss InputGroup,
// restyled to our hairline/mono tokens (rounded-none, no shadow/ring)
// instead of its shadcn defaults - see the `!` overrides below.
//
// USDC-only for now, hence USD_RATE hardcoded to 1 - kept as a named
// constant rather than inlined so the day this vault accepts a second
// asset, the "amount x rate" line is the one place that changes.
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { AnnotationText } from "@/components/ui/AnnotationText";
import { TokenIcon } from "@/components/Vault/TokenIcon";
import { Tabs } from "@/components/ui/Tabs";
import { useTokenBalance } from "@/hooks/useTokenBalance";
import { previewDeposit, previewWithdraw, parseAmount } from "@/shared/vault";
import { fmtUsdFull, fmtFeePct } from "@/shared/format";
import type { UserPosition, VaultInfo } from "@/types";

// ─── CONSTANTS ───
const USD_RATE = 1; // USDC only, for now — see file header.
const PERCENT_PILLS = [25, 50, 75, 100] as const;
const DEPOSIT_FEE = 0;
const WITHDRAW_FEE = 0;

// ─── TYPES ───
type Tab = "deposit" | "withdraw";
interface DepositWithdrawProps {
  info: VaultInfo;
  position: UserPosition | null;
  onSubmit?: (tab: Tab, amount: number) => void;
}

// ─── UTILS ───
function FeeRow({ label, value, tooltip }: { label: string; value: string; tooltip: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-muted/60">
        {label}
        <InfoTooltip>{tooltip}</InfoTooltip>
      </span>
      <span className="font-mono text-xs tabular-nums text-body">{value}</span>
    </div>
  );
}

// ─── MAIN ───
export function DepositWithdraw({ info, position, onSubmit }: DepositWithdrawProps) {
  // state
  const [tab, setTab] = useState<Tab>("deposit");
  const [raw, setRaw] = useState("");

  // derived
  const { balance: walletBalance, isLoading: balanceLoading, connected } = useTokenBalance(info.tokenContractAddress);
  const max = tab === "deposit" ? walletBalance ?? 0 : position?.valueUsd ?? 0;
  const amount = parseAmount(raw);
  const overMax = amount != null && amount > max;

  const preview = useMemo(() => {
    if (amount == null || amount === 0) return null;
    return tab === "deposit"
      ? { label: "You receive", value: `${previewDeposit(amount, info.sharePrice).toLocaleString("en-US", { maximumFractionDigits: 2 })} shares` }
      : { label: "You receive", value: fmtUsdFull(previewWithdraw(amount / info.sharePrice, info.sharePrice)) };
  }, [amount, tab, info.sharePrice]);

  const canSubmit = connected && amount != null && amount > 0 && !overMax;

  return (
    <section className="rounded-none border border-hairline bg-panel/20">
      <Tabs
        tabs={[{ id: "deposit", label: "deposit" }, { id: "withdraw", label: "withdraw" }]}
        active={tab}
        onChange={(t) => { setTab(t); setRaw(""); }}
        fullWidth
      />

      <div className="flex flex-col gap-4 p-4">
        {/* amount */}
        <div>
          <div className="mb-1 flex items-center justify-between font-mono text-xs text-muted/60">
            <span>{tab === "deposit" ? `${info.asset} amount` : `${info.asset} value`}</span>
            <span>
              Available{" "}
              {!connected
                ? "—"
                : tab === "deposit"
                  ? balanceLoading
                    ? "…"
                    : `${max.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${info.asset}`
                  : fmtUsdFull(max)}
            </span>
          </div>
          <InputGroup className="!rounded-none !border-hairline !bg-base !shadow-none !ring-0 before:!hidden focus-within:!border-violet">
            <InputGroupInput
              inputMode="decimal"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="0.00"
              className="font-mono text-lg tabular-nums text-body placeholder:text-muted/40"
            />
            <InputGroupAddon align="inline-end" className="gap-1.5">
              <TokenIcon symbol={info.asset} logoURI={info.assetLogoURI} className="!size-6" />
              <InputGroupText className="font-mono text-xs uppercase tracking-wider text-muted">
                {info.asset}
              </InputGroupText>
            </InputGroupAddon>
          </InputGroup>
          <div className="mt-1 flex items-center justify-between font-mono text-xs">
            <span className={overMax ? "" : "text-muted/40"} style={overMax ? { color: "#E0607F" } : undefined}>
              {overMax ? "Exceeds available." : " "}
            </span>
            <span className="text-muted/40">{fmtUsdFull((amount ?? 0) * USD_RATE)}</span>
          </div>

          {/* percent pills */}
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {PERCENT_PILLS.map((p) => (
              <button
                key={p}
                onClick={() => setRaw(String(max * (p / 100)))}
                disabled={!connected}
                className="rounded-full border border-hairline py-1 font-mono text-[11px] uppercase tracking-wider text-muted transition-colors hover:border-violet hover:text-body disabled:cursor-not-allowed disabled:opacity-40"
              >
                {p === 100 ? "Max" : `${p}%`}
              </button>
            ))}
          </div>
        </div>

        {/* preview */}
        {preview && (
          <div className="flex items-center justify-between border-y border-hairline/60 py-2 font-mono text-xs">
            <span className="flex items-center gap-1 text-muted/60">
              {preview.label}
              <InfoTooltip>
                <AnnotationText>
                  Deposits mint shares at the current share price; withdrawals burn shares back to {info.asset} the same way. This mirrors an ERC-4626 vault&apos;s previewDeposit / previewRedeem — no surprises beyond how the pool&apos;s real allocation moves before execution.
                </AnnotationText>
              </InfoTooltip>
            </span>
            <span className="text-body">{preview.value}</span>
          </div>
        )}

        {/* action */}
        <button
          onClick={() => canSubmit && onSubmit?.(tab, amount!)}
          disabled={!canSubmit}
          className={`w-full rounded-full py-2.5 font-mono text-xs uppercase tracking-wider transition-colors ${
            canSubmit
              ? "border border-violet bg-violet/10 text-violet-bright hover:bg-violet/20"
              : "cursor-not-allowed border border-hairline text-muted/40"
          }`}
        >
          {!connected ? "Connect wallet" : tab === "deposit" ? "Deposit" : "Withdraw"}
        </button>

        {/* fees + disclaimer */}
        <div className="flex flex-col gap-2 border-t border-hairline/60 pt-3">
          <FeeRow
            label="Deposit fee"
            value={fmtFeePct(DEPOSIT_FEE)}
            tooltip="Vigil charges no deposit fee. The full amount is converted to shares at the live share price."
          />
          <FeeRow
            label="Withdrawal fee"
            value={fmtFeePct(WITHDRAW_FEE)}
            tooltip="Vigil charges no withdrawal fee. Shares are burned back to USDC at the live share price."
          />
          <p className="text-xs leading-relaxed text-muted/50">
            Amounts execute at the vault&apos;s live share price at transaction time, which may differ slightly from this preview.
          </p>
        </div>
      </div>
    </section>
  );
}
