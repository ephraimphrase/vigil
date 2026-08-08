"use client";

import { getContract } from "thirdweb";
import { chainForId } from "@/lib/chains";
import { thirdwebClient } from "@/lib/thirdweb-client";
import { FunctionCard } from "./FunctionCard";

type AbiFunction = {
  type: "function";
  name: string;
  inputs: { name: string; type: string }[];
  outputs: { name: string; type: string }[];
  stateMutability: string;
};

export function ContractPanel({
  chainId,
  name,
  address,
  abi,
}: {
  chainId: string;
  name: string;
  address: string;
  abi: readonly unknown[];
}) {
  if (!thirdwebClient) {
    return (
      <p className="text-sm text-amber-400">
        NEXT_PUBLIC_THIRDWEB_CLIENT_ID isn&apos;t set - the debug page needs it
        to read/write contracts.
      </p>
    );
  }

  const contract = getContract({
    client: thirdwebClient,
    chain: chainForId(chainId),
    address,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- deployedContracts.ts's `as const` ABI narrows further than thirdweb's Abi type expects
    abi: abi as any,
  });

  const functions = (abi as AbiFunction[]).filter(
    (item) => item.type === "function",
  );
  const reads = functions.filter(
    (f) => f.stateMutability === "view" || f.stateMutability === "pure",
  );
  const writes = functions.filter(
    (f) => f.stateMutability !== "view" && f.stateMutability !== "pure",
  );

  return (
    <div className="rounded-xl border border-white/10 p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">{name}</h2>
        <p className="font-mono text-xs text-white/50">{address}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-blue-400">
            Read ({reads.length})
          </h3>
          <div className="space-y-2">
            {reads.map((fn, i) => (
              <FunctionCard
                key={`${fn.name}-${i}`}
                contract={contract}
                fn={fn}
              />
            ))}
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-amber-400">
            Write ({writes.length})
          </h3>
          <div className="space-y-2">
            {writes.map((fn, i) => (
              <FunctionCard
                key={`${fn.name}-${i}`}
                contract={contract}
                fn={fn}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
