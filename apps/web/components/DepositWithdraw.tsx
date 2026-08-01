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
function UsdcIcon() {
  return (
    <svg className="!size-6 shrink-0" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <g fill="none">
        <circle fill="#2775CA" cx="16" cy="16" r="16" />
        <g fill="#FFF">
          <path d="M20.022 18.124c0-2.124-1.28-2.852-3.84-3.156-1.828-.243-2.193-.728-2.193-1.578 0-.85.61-1.396 1.828-1.396 1.097 0 1.707.364 2.011 1.275a.458.458 0 00.427.303h.975a.416.416 0 00.427-.425v-.06a3.04 3.04 0 00-2.743-2.489V9.142c0-.243-.183-.425-.487-.486h-.915c-.243 0-.426.182-.487.486v1.396c-1.829.242-2.986 1.456-2.986 2.974 0 2.002 1.218 2.791 3.778 3.095 1.707.303 2.255.668 2.255 1.639 0 .97-.853 1.638-2.011 1.638-1.585 0-2.133-.667-2.316-1.578-.06-.242-.244-.364-.427-.364h-1.036a.416.416 0 00-.426.425v.06c.243 1.518 1.219 2.61 3.23 2.914v1.457c0 .242.183.425.487.485h.915c.243 0 .426-.182.487-.485V21.34c1.829-.303 3.047-1.578 3.047-3.217z" />
          <path d="M12.892 24.497c-4.754-1.7-7.192-6.98-5.424-11.653.914-2.55 2.925-4.491 5.424-5.402.244-.121.365-.303.365-.607v-.85c0-.242-.121-.424-.365-.485-.061 0-.183 0-.244.06a10.895 10.895 0 00-7.13 13.717c1.096 3.4 3.717 6.01 7.13 7.102.244.121.488 0 .548-.243.061-.06.061-.122.061-.243v-.85c0-.182-.182-.424-.365-.546zm6.46-18.936c-.244-.122-.488 0-.548.242-.061.061-.061.122-.061.243v.85c0 .243.182.485.365.607 4.754 1.7 7.192 6.98 5.424 11.653-.914 2.55-2.925 4.491-5.424 5.402-.244.121-.365.303-.365.607v.85c0 .242.121.424.365.485.061 0 .183 0 .244-.06a10.895 10.895 0 007.13-13.717c-1.096-3.46-3.778-6.07-7.13-7.162z" />
        </g>
      </g>
    </svg>
  );
}

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
  const connected = position != null;
  const max = tab === "deposit" ? position?.walletUsdc ?? 0 : position?.valueUsd ?? 0;
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
      {/* tabs */}
      <div className="grid grid-cols-2 border-b border-hairline">
        {(["deposit", "withdraw"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setRaw(""); }}
            className={`relative py-2.5 font-mono text-xs uppercase tracking-wider transition-colors ${
              tab === t ? "text-body" : "text-muted/60 hover:text-muted"
            }`}
          >
            {tab === t && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-violet" />}
            {t}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 p-4">
        {/* amount */}
        <div>
          <div className="mb-1 flex items-center justify-between font-mono text-xs text-muted/60">
            <span>{tab === "deposit" ? `${info.asset} amount` : `${info.asset} value`}</span>
            <span>Available {connected ? fmtUsdFull(max) : "—"}</span>
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
              <UsdcIcon />
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
