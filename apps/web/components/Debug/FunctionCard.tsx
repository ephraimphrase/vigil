"use client";

import { useState } from "react";
import {
  prepareContractCall,
  readContract,
  type ThirdwebContract,
} from "thirdweb";
import { useActiveAccount, useSendTransaction } from "thirdweb/react";

type AbiInput = { name: string; type: string };
type AbiFunction = {
  type: "function";
  name: string;
  inputs: AbiInput[];
  outputs: AbiInput[];
  stateMutability: string;
};

// Best-effort text -> ABI-typed value. Arrays/tuples are entered as raw
// JSON (e.g. `[1,2,3]`) rather than getting per-element inputs - covers
// the common primitive-arg case cleanly, punts on nested-input UX.
function parseInput(type: string, raw: string): unknown {
  if (type.endsWith("[]") || type.startsWith("tuple")) {
    return raw.trim() === "" ? [] : JSON.parse(raw);
  }
  if (type.startsWith("uint") || type.startsWith("int")) {
    return raw.trim() === "" ? 0n : BigInt(raw.trim());
  }
  if (type === "bool") return raw.trim() === "true" || raw.trim() === "1";
  return raw; // address, string, bytes
}

function stringifyResult(data: unknown): string {
  return JSON.stringify(
    data,
    (_key, value) => (typeof value === "bigint" ? value.toString() : value),
    2,
  );
}

export function FunctionCard({
  contract,
  fn,
}: {
  contract: ThirdwebContract;
  fn: AbiFunction;
}) {
  const isRead = fn.stateMutability === "view" || fn.stateMutability === "pure";
  const [values, setValues] = useState<string[]>(() => fn.inputs.map(() => ""));
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { mutate: sendTx, isPending } = useSendTransaction();
  const account = useActiveAccount();

  function buildParams(): unknown[] {
    return fn.inputs.map((input, i) => parseInput(input.type, values[i] ?? ""));
  }

  async function handleRead() {
    setError(null);
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic ABI-driven call, params/method shape isn't known until runtime
      const data = await readContract({
        contract,
        method: fn as any,
        params: buildParams() as any,
      });
      setResult(stringifyResult(data));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  function handleWrite() {
    setError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- see handleRead
      const tx = prepareContractCall({
        contract,
        method: fn as any,
        params: buildParams() as any,
      });
      sendTx(tx, {
        onSuccess: (receipt) => setResult(`tx: ${receipt.transactionHash}`),
        onError: (e) => setError(e.message),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="rounded-lg border border-white/10 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-sm">{fn.name}</span>
        <span
          className={`text-xs uppercase ${isRead ? "text-blue-400" : "text-amber-400"}`}
        >
          {fn.stateMutability}
        </span>
      </div>

      {fn.inputs.length > 0 && (
        <div className="mt-2 space-y-2">
          {fn.inputs.map((input, i) => (
            <input
              key={i}
              placeholder={`${input.name || `arg${i}`} (${input.type})`}
              value={values[i] ?? ""}
              onChange={(e) =>
                setValues((prev) =>
                  prev.map((val, idx) => (idx === i ? e.target.value : val)),
                )
              }
              className="w-full rounded border border-white/10 bg-black/20 px-2 py-1 font-mono text-sm"
            />
          ))}
        </div>
      )}

      <button
        onClick={isRead ? handleRead : handleWrite}
        disabled={loading || isPending || (!isRead && !account)}
        className="mt-3 rounded bg-violet px-3 py-1 text-sm text-white disabled:opacity-40"
      >
        {isRead
          ? loading
            ? "Reading..."
            : "Read"
          : isPending
            ? "Sending..."
            : "Write"}
      </button>
      {!isRead && !account && (
        <p className="mt-1 text-xs text-amber-400">
          Connect a wallet to write.
        </p>
      )}

      {result !== null && (
        <pre className="mt-2 overflow-x-auto text-xs text-emerald-400">
          {result}
        </pre>
      )}
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
