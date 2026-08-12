"use client";

import { PiDropSimpleLight } from "react-icons/pi";
import { useFaucetModal } from "@/components/Wallet/FaucetModalProvider";

export function FaucetTriggerButton() {
  const { openFaucet } = useFaucetModal();

  return (
    <button
      type="button"
      onClick={openFaucet}
      aria-label="Get test tokens"
      title="Get test tokens"
      className="flex h-8 w-8 items-center justify-center rounded-full border border-hairline text-muted transition-colors hover:border-violet hover:text-violet-bright"
    >
      <PiDropSimpleLight className="h-4 w-4" />
    </button>
  );
}
