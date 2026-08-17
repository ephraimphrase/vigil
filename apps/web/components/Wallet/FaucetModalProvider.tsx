"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { FaucetModal } from "@/components/Wallet/FaucetModal";

interface FaucetModalContextValue {
  openFaucet: () => void;
}

const FaucetModalContext = createContext<FaucetModalContextValue>({ openFaucet: () => {} });

export function useFaucetModal(): FaucetModalContextValue {
  return useContext(FaucetModalContext);
}

export function FaucetModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <FaucetModalContext.Provider value={{ openFaucet: () => setOpen(true) }}>
      {children}
      <FaucetModal open={open} onOpenChange={setOpen} />
    </FaucetModalContext.Provider>
  );
}
