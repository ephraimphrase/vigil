"use client";

// ─────────────────────────────────────────────────────────────
// FaucetModal — lets a connected wallet claim test tokens (testTokens.ts,
// synced from apps/contracts/data/84532/token.json) from the Faucet
// contract in one batched claimMany() transaction. Controlled dialog (no
// own trigger) - opened from ConnectWallet.tsx's details-modal footer, same
// Base UI Dialog pattern as VaultsFilterDialog.tsx.
//
// The token list renders regardless of whether Faucet is deployed yet -
// only the cooldown lookup and the claim action need the live contract, and
// those degrade to "unknown cooldown" / a disabled button instead of
// hiding the whole list. CooldownFetcher below only mounts (and only then
// calls useReadContract) once a contract exists, so this never has to pass
// a null/undefined contract into a hook that requires a real one.
// ─────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { PiMagnifyingGlassLight } from "react-icons/pi";
import { useActiveAccount, useReadContract } from "thirdweb/react";
import type { ThirdwebContract } from "thirdweb";
import { TokenIcon } from "@/components/Vault/TokenIcon";
import { useApi } from "@/hooks/useApi";
import { useFaucet, useFaucetContract, type FaucetToken } from "@/hooks/useFaucet";
import { testTokens } from "@/lib/testTokens";
import { toast } from "@/components/ui/Toast";
import type { VaultSummary } from "@/types";

const FAUCET_CHAIN_ID = "84532";

interface DisplayToken extends FaucetToken {
  name: string;
  logoURI: string;
}

// token.json accumulates every token ever deployed across every redeploy
// (458 and counting) - most of those don't back any vault that currently
// exists. Cross-referencing against /api/vaults's own asset addresses
// keeps the faucet limited to "tokens you can actually go deposit
// somewhere with" instead of a pile of orphaned test tokens.
const ALL_TOKENS: DisplayToken[] = testTokens[FAUCET_CHAIN_ID] ?? [];

function cooldownLabel(availableAt: bigint): string {
  const remainingMs = Number(availableAt) * 1000 - Date.now();
  if (remainingMs <= 0) return "";
  const hours = Math.ceil(remainingMs / (60 * 60 * 1000));
  return hours <= 1 ? "available in <1h" : `available in ${hours}h`;
}

interface FaucetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FaucetModal({ open, onOpenChange }: FaucetModalProps) {
  const contract = useFaucetContract();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-bg/70 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 flex h-176 max-h-[90vh] w-lg max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden border border-hairline bg-panel transition-all data-ending-style:scale-98 data-ending-style:opacity-0 data-starting-style:scale-98 data-starting-style:opacity-0">
          <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
            <div>
              <Dialog.Title className="font-display text-lg leading-none text-body">
                Get test tokens.
              </Dialog.Title>
              <p className="mt-1.5 text-xs text-muted">
                {contract
                  ? "Base Sepolia only - one signature claims every token selected below."
                  : "Base Sepolia only - the faucet contract isn't deployed yet, so claiming is disabled for now."}
              </p>
            </div>
            <Dialog.Close
              aria-label="Close faucet"
              className="flex h-5 w-5 shrink-0 items-center justify-center border border-transparent font-body text-sm leading-none text-muted transition-colors hover:border-hairline hover:text-body"
            >
              &times;
            </Dialog.Close>
          </div>

          <FaucetModalBody contract={contract} open={open} onClose={() => onOpenChange(false)} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CooldownFetcher({
  contract,
  account,
  tokenAddresses,
  open,
  onData,
}: {
  contract: ThirdwebContract;
  account: string;
  tokenAddresses: `0x${string}`[];
  open: boolean;
  onData: (data: readonly bigint[] | undefined) => void;
}) {
  const { data } = useReadContract({
    contract,
    method: "function claimableAt(address user, address[] tokens) view returns (uint256[])",
    params: [account as `0x${string}`, tokenAddresses],
    queryOptions: { enabled: open && tokenAddresses.length > 0 },
  });

  useEffect(() => {
    onData(data);
  }, [data, onData]);

  return null;
}

function FaucetModalBody({
  contract,
  open,
  onClose,
}: {
  contract: ThirdwebContract | null;
  open: boolean;
  onClose: () => void;
}) {
  const account = useActiveAccount();
  const { claimMany, isPending } = useFaucet();
  const { data: vaults, isLoading: vaultsLoading } = useApi<VaultSummary[]>("/api/vaults", []);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [claimableAt, setClaimableAt] = useState<readonly bigint[] | undefined>();

  const tokens = useMemo(() => {
    const liveAssets = new Set(vaults.map((v) => v.tokenContractAddress.toLowerCase()));
    return ALL_TOKENS.filter((t) => liveAssets.has(t.address.toLowerCase()));
  }, [vaults]);
  const tokenAddresses = useMemo(() => tokens.map((t) => t.address as `0x${string}`), [tokens]);

  // Reset the selection to "everything claimable" each time the modal opens
  // (or once the live-vault list resolves, since `tokens` starts empty).
  useEffect(() => {
    if (!open) return;
    setSearch("");
    setSelected(new Set(tokens.map((t) => t.address)));
  }, [open, tokens]);

  const visible = useMemo(
    () =>
      tokens.filter(
        (t) =>
          t.symbol.toLowerCase().includes(search.toLowerCase()) ||
          t.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [tokens, search],
  );

  const cooldowns = useMemo(() => {
    const map = new Map<string, string>();
    if (!claimableAt) return map;
    tokens.forEach((t, i) => {
      const label = cooldownLabel(claimableAt[i] ?? 0n);
      if (label) map.set(t.address, label);
    });
    return map;
  }, [tokens, claimableAt]);

  const toggle = (address: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(address)) next.delete(address);
      else next.add(address);
      return next;
    });
  };

  const selectedClaimable = tokens.filter((t) => selected.has(t.address) && !cooldowns.has(t.address));

  async function handleClaim() {
    try {
      await claimMany(selectedClaimable);
      onClose();
    } catch (e) {
      toast.error("Faucet claim failed", { description: e instanceof Error ? e.message : undefined });
    }
  }

  return (
    <>
      {contract && account?.address && (
        <CooldownFetcher
          contract={contract}
          account={account.address}
          tokenAddresses={tokenAddresses}
          open={open}
          onData={setClaimableAt}
        />
      )}

      <div className="flex items-center gap-2 border-b border-hairline px-6 py-3">
        <PiMagnifyingGlassLight className="h-3.5 w-3.5 shrink-0 text-muted" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tokens"
          aria-label="Search tokens"
          className="w-full bg-transparent text-sm text-body outline-none"
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-2">
        {vaultsLoading ? (
          <span className="px-3 py-4 text-sm text-muted">Loading tokens…</span>
        ) : visible.length === 0 ? (
          <span className="px-3 py-4 text-sm text-muted">No matching tokens.</span>
        ) : (
          visible.map((t) => {
            const cooldown = cooldowns.get(t.address);
            return (
              <label
                key={t.address}
                className={`flex items-center justify-between gap-3 px-3 py-2 transition-colors ${
                  cooldown ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-base/60"
                }`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <TokenIcon symbol={t.symbol} logoURI={t.logoURI} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-body">{t.name}</p>
                    <p className="font-mono text-xs uppercase tracking-wider text-muted/60">
                      {cooldown ?? t.symbol}
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={selected.has(t.address) && !cooldown}
                  disabled={!!cooldown}
                  onChange={() => toggle(t.address)}
                  className="h-3.5 w-3.5 shrink-0 rounded-none border border-hairline bg-transparent accent-violet"
                />
              </label>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-hairline px-6 py-4">
        <span className="font-mono text-xs uppercase tracking-wider text-muted">
          {selectedClaimable.length} selected
        </span>
        <button
          type="button"
          disabled={!contract || !account || isPending || selectedClaimable.length === 0}
          onClick={handleClaim}
          className="rounded-full bg-gradient-to-br from-violet-bright to-violet px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {!contract
            ? "Faucet not deployed"
            : !account
              ? "Connect wallet"
              : isPending
                ? "Claiming…"
                : "Claim selected"}
        </button>
      </div>
    </>
  );
}
