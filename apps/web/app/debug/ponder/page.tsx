import { ponder } from "@/lib/ponder/client";

// Local-dev tool, not linked from the main nav.
export const dynamic = "force-dynamic";

export default async function DebugPonderPage() {
  const [{ vaults }, { adapters }] = await Promise.all([
    ponder.Vaults({ limit: 20, orderBy: "createdAtTimestamp", orderDirection: "desc" }),
    ponder.Adapters({ limit: 20, orderBy: "addedAtTimestamp", orderDirection: "desc" }),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Debug Ponder</h1>
        <p className="text-sm text-white/50">
          Reads from lib/ponder/client.ts, generated via{" "}
          <code>pnpm ponder:codegen</code> from apps/ponder&apos;s GraphQL
          schema.
        </p>
      </div>

      <div className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">
          Vaults ({vaults.totalCount})
        </h2>
        {vaults.items.length === 0 ? (
          <p className="text-white/60">No vaults indexed yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-white/50">
              <tr>
                <th className="pr-4 pb-2">Name</th>
                <th className="pr-4 pb-2">Symbol</th>
                <th className="pr-4 pb-2">Asset</th>
                <th className="pr-4 pb-2">Address</th>
              </tr>
            </thead>
            <tbody>
              {vaults.items.map((vault) => (
                <tr key={vault.id} className="border-t border-white/10">
                  <td className="py-2 pr-4">{vault.vaultName}</td>
                  <td className="py-2 pr-4">{vault.vaultSymbol}</td>
                  <td className="py-2 pr-4">{vault.assetSymbol}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{vault.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">
          Adapters ({adapters.totalCount})
        </h2>
        {adapters.items.length === 0 ? (
          <p className="text-white/60">No adapters indexed yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-white/50">
              <tr>
                <th className="pr-4 pb-2">Strategy</th>
                <th className="pr-4 pb-2">APY (bps)</th>
                <th className="pr-4 pb-2">Allocated</th>
                <th className="pr-4 pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {adapters.items.map((adapter) => (
                <tr key={adapter.id} className="border-t border-white/10">
                  <td className="py-2 pr-4">{adapter.stratName}</td>
                  <td className="py-2 pr-4">{adapter.apyBps}</td>
                  <td className="py-2 pr-4">{adapter.allocated}</td>
                  <td className="py-2 pr-4">
                    {adapter.retired
                      ? "retired"
                      : adapter.paused
                        ? "paused"
                        : "active"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
