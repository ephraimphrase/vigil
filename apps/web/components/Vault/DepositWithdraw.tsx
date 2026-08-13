"use client";

// ─────────────────────────────────────────────────────────────
// DepositWithdraw — the action panel. Tabbed deposit / withdraw, quick-pick
// percent pills + amount, live preview. Amount math is pure (shared/vault),
// mirroring ERC4626 previewDeposit/previewRedeem. Submit is a stub - wire
// to approve+deposit / redeem later. Amount field is the coss InputGroup,
// restyled to our hairline/mono tokens (rounded-none, no shadow/ring)
// instead of its shadcn defaults - see the `!` overrides below.
//
// The USD-equivalent line under the amount comes from useTokenPrices()
// (lib/tokenPrices.ts, CoinGecko-backed) - "-" when this asset has no
// verified price mapping (lib/tokenPriceIds.ts) rather than guessing a
// 1:1 rate, since most vault assets here aren't stablecoins.
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { AnnotationText } from "@/components/ui/AnnotationText";
import { TokenIcon } from "@/components/Vault/TokenIcon";
import { Tabs } from "@/components/ui/Tabs";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { useVaultDeposit } from "@/hooks/useVaultDeposit";
import { useVaultWithdraw } from "@/hooks/useVaultWithdraw";
import { toast } from "@/components/ui/Toast";
import { previewDeposit, previewWithdraw, parseAmount } from "@/shared/vault";
import { fmtUsdFull, fmtFeePct } from "@/shared/format";
import type { VaultInfo } from "@/types";

// ─── CONSTANTS ───
const PERCENT_PILLS = [25, 50, 75, 100] as const;
const DEPOSIT_FEE = 0;
const WITHDRAW_FEE = 0;

// ─── TYPES ───
type Tab = "deposit" | "withdraw";
interface DepositWithdrawProps {
  info: VaultInfo;
  onSubmit?: (tab: Tab, amount: number) => void;
  /** Called after a deposit/withdraw tx confirms on-chain - lets the parent refresh vault-level data (tvl, apy) that this panel doesn't own. "Your deposit" doesn't need a separate call here - it reads the same withdrawable/refetchWithdrawable this panel already refetches below. */
  onTxConfirmed?: () => void;
  /** Lifted to VaultDetailView (useVaultWithdrawable) rather than mounted here too - the masthead's "Your deposit" reads the exact same value, and a second independent hook instance is one more place a post-tx refetch could silently miss. */
  withdrawable: number | null;
  withdrawableLoading: boolean;
  refetchWithdrawable: () => void;
  /** Lifted to VaultDetailView (useTokenBalance) for the same reason as withdrawable - "Your position"'s walletUsdc reads this exact value too. */
  walletBalance: number | null;
  walletBalanceLoading: boolean;
  refetchWalletBalance: () => void;
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

function showTxToast(action: "Deposit" | "Withdrawal", explorerUrl: string | null) {
  toast.success(`${action} confirmed`, {
    description: explorerUrl ? (
      <a href={explorerUrl} target="_blank" rel="noreferrer" className="underline hover:text-body">
        View on explorer ↗
      </a>
    ) : undefined,
  });
}

// ─── MAIN ───
export function DepositWithdraw({
  info,
  onSubmit,
  onTxConfirmed,
  withdrawable,
  withdrawableLoading,
  refetchWithdrawable,
  walletBalance,
  walletBalanceLoading,
  refetchWalletBalance,
}: DepositWithdrawProps) {
  // state
  const [tab, setTab] = useState<Tab>("deposit");
  const [raw, setRaw] = useState("");

  // derived
  const account = useActiveAccount();
  const connected = !!account;
  const { deposit, isPending: depositPending } = useVaultDeposit(info.vaultContractAddress, info.tokenContractAddress);
  const { withdraw, isPending: withdrawPending } = useVaultWithdraw(info.vaultContractAddress, info.tokenContractAddress);
  const { prices } = useTokenPrices();
  const priceUsd = prices[info.tokenContractAddress.toLowerCase()] ?? null;

  const max = tab === "deposit" ? walletBalance ?? 0 : withdrawable ?? 0;
  const amountLoading = tab === "deposit" ? walletBalanceLoading : withdrawableLoading;
  const amount = parseAmount(raw);
  const overMax = amount != null && amount > max;
  const submitting = tab === "deposit" ? depositPending : withdrawPending;

  const preview = useMemo(() => {
    if (amount == null || amount === 0) return null;
    return tab === "deposit"
      ? { label: "You receive", value: `${previewDeposit(amount, info.sharePrice).toLocaleString("en-US", { maximumFractionDigits: 2 })} shares` }
      : {
          label: "You receive",
          value: `${previewWithdraw(amount / info.sharePrice, info.sharePrice).toLocaleString("en-US", { maximumFractionDigits: 4 })} ${info.asset}`,
        };
  }, [amount, tab, info.sharePrice, info.asset]);

  const canSubmit = connected && amount != null && amount > 0 && !overMax && !submitting;

  async function handleSubmit() {
    if (!canSubmit || amount == null) return;

    try {
      if (tab === "deposit") {
        const { explorerUrl } = await deposit(raw, info.asset);
        refetchWalletBalance();
        refetchWithdrawable();
        showTxToast("Deposit", explorerUrl);
      } else {
        const { explorerUrl } = await withdraw(raw, info.asset);
        refetchWalletBalance();
        refetchWithdrawable();
        showTxToast("Withdrawal", explorerUrl);
      }
      setRaw("");
      onSubmit?.(tab, amount);
      onTxConfirmed?.();
    } catch (e) {
      toast.error(tab === "deposit" ? "Deposit failed" : "Withdrawal failed", {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }

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
                : amountLoading
                  ? "…"
                  : `${max.toLocaleString("en-US", { maximumFractionDigits: 4 })} ${info.asset}`}
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
            <span className="text-muted/40">
              {priceUsd == null ? "-" : fmtUsdFull((amount ?? 0) * priceUsd)}
            </span>
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
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full rounded-full py-2.5 font-mono text-xs uppercase tracking-wider transition-colors ${
            canSubmit
              ? "border border-violet bg-violet/10 text-violet-bright hover:bg-violet/20"
              : "cursor-not-allowed border border-hairline text-muted/40"
          }`}
        >
          {!connected
            ? "Connect wallet"
            : submitting
              ? tab === "deposit"
                ? "Depositing…"
                : "Withdrawing…"
              : tab === "deposit"
                ? "Deposit"
                : "Withdraw"}
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
