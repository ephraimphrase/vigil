"use client";

import { useState } from "react";
import { ConnectButton } from "thirdweb/react";
import { ContractPanel } from "@/components/Debug/ContractPanel";
import { chainForId } from "@/lib/chains";
import { thirdwebClient } from "@/lib/thirdweb-client";
import { deployedContracts } from "@/lib/deployedContracts";

// Debug page: call any read/write function on any contract
// script/lib/DeployRegistrar.sol registered, without writing one-off UI
// per contract. Local-dev tool, not linked from the main nav.
export default function DebugPage() {
  const chainIds = Object.keys(deployedContracts);
  const [chainId, setChainId] = useState(chainIds[0] ?? "31337");

  const contracts =
    (
      deployedContracts as Record<
        string,
        Record<string, { address: string; abi: readonly unknown[] }>
      >
    )[chainId] ?? {};

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Debug Contracts</h1>
          <p className="text-sm text-white/50">
            Generated from
            apps/contracts/data/&lt;chainId&gt;/deployedContracts.json - run{" "}
            <code>pnpm sync-contracts</code> after deploying to refresh.
          </p>
        </div>
        {thirdwebClient && <ConnectButton client={thirdwebClient} />}
      </div>

      {chainIds.length === 0 && (
        <p className="text-white/60">
          No deployed contracts found. Run <code>apps/contracts/deploy.sh</code>{" "}
          first.
        </p>
      )}

      {chainIds.length > 1 && (
        <div className="mb-6">
          <label className="mr-2 text-sm text-white/60">Chain:</label>
          <select
            value={chainId}
            onChange={(e) => setChainId(e.target.value)}
            className="rounded border border-white/10 bg-black/20 px-2 py-1 text-sm"
          >
            {chainIds.map((id) => (
              <option key={id} value={id}>
                {id} ({chainForId(id).name ?? "unknown"})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(contracts).map(([name, { address, abi }]) => (
          <ContractPanel
            key={name}
            chainId={chainId}
            name={name}
            address={address}
            abi={abi}
          />
        ))}
      </div>
    </div>
  );
}
