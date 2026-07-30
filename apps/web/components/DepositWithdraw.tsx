"use client";

// ─────────────────────────────────────────────────────────────
// DepositWithdraw — the action panel. Tabbed deposit / withdraw, amount +
// MAX, live preview. Amount math is pure (shared/vault), mirroring ERC4626
// previewDeposit/previewRedeem. Submit is a stub - wire to approve+deposit /
// redeem later. Amount field is the coss InputGroup, restyled to our
// hairline/mono tokens (rounded-none, no shadow/ring) instead of its
// shadcn defaults - see the `!` overrides below.
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { AnnotationText } from "@/components/ui/AnnotationText";
import { previewDeposit, previewWithdraw, parseAmount } from "@/shared/vault";
import { fmtUsdFull } from "@/shared/format";
import type { UserPosition, VaultInfo } from "@/types";

// ─── TYPES ───
type Tab = "deposit" | "withdraw";
interface DepositWithdrawProps {
  info: VaultInfo;
  position: UserPosition | null;
  onSubmit?: (tab: Tab, amount: number) => void;
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
            <button
              onClick={() => setRaw(String(max))}
              className="uppercase tracking-wider text-violet-bright transition-colors hover:text-body disabled:text-muted/40"
              disabled={!connected}
            >
              Max {connected ? fmtUsdFull(max) : ""}
            </button>
          </div>
          <InputGroup className="!rounded-none !border-hairline !bg-base !shadow-none !ring-0 before:!hidden focus-within:!border-violet">
            <InputGroupInput
              inputMode="decimal"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="0.00"
              className="font-mono text-lg tabular-nums text-body placeholder:text-muted/40"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupText className="font-mono text-xs uppercase tracking-wider text-muted">{info.asset}</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
          {overMax && <div className="mt-1 font-mono text-xs" style={{ color: "#E0607F" }}>Exceeds available.</div>}
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
      </div>
    </section>
  );
}
