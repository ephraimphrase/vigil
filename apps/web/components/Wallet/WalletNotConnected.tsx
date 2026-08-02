// ─────────────────────────────────────────────────────────────
// WalletNotConnected — drop-in replacement for any "your data" panel body
// when there's no active wallet. Same shape as EmptyState (icon, mono
// uppercase label, muted sans line) plus the actual connect CTA inline, so
// the dead end is actionable rather than just informative. Reuses
// ConnectWallet (thirdweb) rather than a bespoke button - one connect flow,
// themed once, everywhere it's triggered.
// ─────────────────────────────────────────────────────────────

import { PiWalletLight } from "react-icons/pi";
import { ConnectWallet } from "./ConnectWallet";

interface WalletNotConnectedProps {
  message?: string;
  className?: string;
}

export function WalletNotConnected({
  message = "Connect a wallet to see your positions.",
  className = "",
}: WalletNotConnectedProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-12 ${className}`}>
      <PiWalletLight className="h-6 w-6 text-muted/30" />
      <span className="font-mono text-xs uppercase tracking-wider text-muted">
        No wallet connected
      </span>
      <span className="max-w-xs text-center text-sm text-muted/60">{message}</span>
      <div className="mt-1">
        <ConnectWallet />
      </div>
    </div>
  );
}
