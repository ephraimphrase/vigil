"use client";


import { useEffect, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { LogoReveal } from "@/components/Layouts/LogoReveal";

const ACK_KEY = "vigil:testnet-notice-ack";
const OPEN_DELAY_MS = 2000;

export function TestnetDisclaimer() {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(ACK_KEY)) return;
    const timer = setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  function acknowledge() {
    localStorage.setItem(ACK_KEY, "1");
    setOpen(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={() => {}}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-bg/80 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 flex w-lg max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-5 border border-hairline bg-panel px-8 py-9 text-center transition-all data-ending-style:scale-98 data-ending-style:opacity-0 data-starting-style:scale-98 data-starting-style:opacity-0">
          <LogoReveal />

          <Dialog.Title className="font-display text-xl text-body">This is testnet.</Dialog.Title>

          <p className="border border-hairline bg-base/40 px-4 py-3 text-left text-sm leading-relaxed text-muted">
            Vigil is running on Base Sepolia right now. Every token you mint or deposit here is a
            test asset modeled on a real protocol, so nothing you do carries real money. Mainnet is
            coming and we&apos;ll announce it the moment it&apos;s live. Scoring, automated
            rebalancing, protocol monitoring, all of it works exactly as it does today. The only
            thing that changes is the money behind it.
          </p>

          <label className="flex items-start gap-2.5 self-start text-left">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-none border border-hairline bg-transparent accent-violet"
            />
            <span className="text-sm text-body">
              I understand this is a testnet environment and no real funds are at risk.
            </span>
          </label>

          <button
            type="button"
            disabled={!checked}
            onClick={acknowledge}
            className="w-full rounded-full bg-gradient-to-br from-violet-bright to-violet px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            {checked ? "Continue to Vigil" : "Confirm the notice above to continue"}
          </button>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
