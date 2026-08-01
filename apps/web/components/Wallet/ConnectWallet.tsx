"use client";

import { ConnectButton, darkTheme } from "thirdweb/react";
import { createWallet, inAppWallet } from "thirdweb/wallets";
import { thirdwebClient } from "@/lib/thirdweb-client";

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
  return (
    <ConnectButton
      client={thirdwebClient}
      wallets={wallets}
      theme={theme}
      connectButton={{ label: "Connect Wallet" }}
      connectModal={{ size: "compact", title: "Connect to Vigil" }}
      appMetadata={{
        name: "Vigil",
        description: "Autonomous protocol risk monitoring and consequence execution system.",
        url: "https://vigil.xyz",
      }}
    />
  );
}
