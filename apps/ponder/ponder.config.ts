import { createConfig } from "ponder";
import { http } from "viem";

import { VaultFactoryAbi } from "./abis/VaultFactoryAbi";

// Base Sepolia only - matches the real testnet deployment tracked in
// apps/contracts/data/84532/deployedContracts.json. VaultFactory is shared
// across every vault ever created on this chain, so indexing its
// VaultCreated event (rather than each individual VigilVault) captures
// every vault as it's created without needing to know their addresses
// ahead of time.
export default createConfig({
  chains: {
    baseSepolia: {
      id: 84532,
      rpc: http(process.env.PONDER_RPC_URL_84532 ?? "https://sepolia.base.org"),
    },
  },
  contracts: {
    VaultFactory: {
      chain: "baseSepolia",
      abi: VaultFactoryAbi,
      address: "0xd0604AB0Cb2CAdd850837c2ea25d5909B15D4cA7",
      // Factory's own creation block (via Basescan) - no vaults could
      // exist before this, so indexing from genesis would just waste
      // time scanning empty blocks.
      startBlock: 45322158,
    },
  },
});
