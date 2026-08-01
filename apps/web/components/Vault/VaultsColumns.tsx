// ─────────────────────────────────────────────────────────────
// VaultsColumns — column defs for the /dashboard/vault picker table.
// Mirrors Columns.tsx / StrategyColumns.tsx: createColumnHelper, one column
// per concern, mono for every number. Vaults are always pooled USDC, so
// the Vault cell uses one fixed UsdcIcon rather than a per-row icon feed;
// chain/asset-type/vault-type ride as a subtitle line under the name, same
// icon+name+subtitle shape as StrategyColumns' protocol rows.
// ─────────────────────────────────────────────────────────────

import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";

import type { VaultSummary } from "../types";
import { fmtUsd, fmtUsdFull, fmtFeePct } from "../shared/format";
import { UsdcIcon } from "./ui/UsdcIcon";
import { BAND_META } from "../shared/health";

const col = createColumnHelper<VaultSummary>();
const PASS = BAND_META.hold.color;
const FAIL = BAND_META.exit.color;

export function buildVaultColumns(): ColumnDef<VaultSummary, any>[] {
  return [
    col.accessor("name", {
      header: "Vault",
      cell: ({ row }) => {
        const v = row.original;
        return (
          <div className="flex items-center gap-2">
            <UsdcIcon className="size-6" />
            <div className="flex flex-col leading-tight">
              <span className="text-sm text-body">{v.name}</span>
              <span className="font-mono text-xs text-muted/60">
                {v.chain} · {v.assetType === "stablecoin" ? "Stablecoin" : "Volatile"} · {v.vaultType}
              </span>
            </div>
          </div>
        );
      },
    }),
    col.accessor("apy", {
      header: "Est. APY",
      cell: ({ getValue }) => (
        <span className="font-mono text-sm tabular-nums text-body">{getValue().toFixed(1)}%</span>
      ),
    }),
    col.accessor("tvl", {
      header: "TVL",
      cell: ({ getValue }) => (
        <span className="font-mono text-sm tabular-nums text-body">{fmtUsd(getValue())}</span>
      ),
    }),
    col.display({
      id: "fees",
      header: "Fees",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-text-muted">
          {fmtFeePct(row.original.managementFeePct)} | {fmtFeePct(row.original.performanceFeePct)}
        </span>
      ),
    }),
    col.accessor("positionValueUsd", {
      header: "Your deposit",
      cell: ({ getValue }) => {
        const v = getValue();
        return (
          <span className="font-mono text-sm tabular-nums text-muted">{v == null ? "—" : fmtUsdFull(v)}</span>
        );
      },
    }),
    col.accessor("riskFlagged", {
      header: "Risk",
      cell: ({ getValue }) => {
        const flagged = getValue();
        return (
          <span className="font-mono text-xs uppercase tracking-wider" style={{ color: flagged > 0 ? FAIL : PASS }}>
            {flagged > 0 ? `${flagged} flagged` : "All clear"}
          </span>
        );
      },
    }),
  ];
}
