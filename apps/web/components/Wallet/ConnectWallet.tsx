"use client";

import { ConnectButton, darkTheme } from "thirdweb/react";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { thirdwebClient } from "@/lib/thirdweb-client";
import { chainForId } from "@/lib/chains";
import { useFaucetModal } from "@/components/Wallet/FaucetModalProvider";

const DEFAULT_CHAIN = chainForId("84532");

const wallets = [
  inAppWallet({
    auth: { options: ["email", "google", "passkey"] },
  }),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("walletConnect"),
];

const theme = darkTheme({
  colors: {
    modalBg: "#170f28",
    borderColor: "rgba(167, 139, 250, 0.15)",
    separatorLine: "rgba(167, 139, 250, 0.15)",
    accentText: "#b06ce1",
    accentButtonBg: "#b06ce1",
    primaryButtonBg: "#b06ce1",
    primaryButtonText: "#0a0712",
    secondaryButtonBg: "#1e1433",
    secondaryButtonText: "#E5DBF1",
    primaryText: "#E5DBF1",
    secondaryText: "#C9C9C9",
    connectedButtonBg: "#170f28",
    connectedButtonBgHover: "#1e1433",
  },
});

export function ConnectWallet() {
  const { openFaucet } = useFaucetModal();

  if (!thirdwebClient) {
    return (
      <button
        type="button"
        disabled
        title="Wallet connect is not configured (missing NEXT_PUBLIC_THIRDWEB_CLIENT_ID)"
        className="cursor-not-allowed rounded-full bg-[#1e1433] px-6 py-1.5 font-body text-sm uppercase text-text/40"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <ConnectButton
      client={thirdwebClient}
      wallets={wallets}
      chain={DEFAULT_CHAIN}
      theme={theme}
      connectButton={{ label: "Connect Wallet" }}
      connectModal={{ size: "compact", title: "Connect to Vigil" }}
      detailsModal={{
        footer: (props) => (
          <button
            type="button"
            onClick={() => {
              props.close();
              openFaucet();
            }}
            className="w-full rounded-full border border-hairline py-2 font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:border-violet hover:text-body"
          >
            Get test tokens
          </button>
        ),
      }}
      appMetadata={{
        name: "Vigil",
        description: "Autonomous protocol risk monitoring and consequence execution system.",
        url: "https://vigil.xyz",
      }}
    />
  );
}
