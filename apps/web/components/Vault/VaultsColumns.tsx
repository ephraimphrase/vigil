// ─────────────────────────────────────────────────────────────
// VaultsColumns — column defs for the /dashboard/vault picker table.
// Mirrors Columns.tsx / StrategyColumns.tsx: createColumnHelper, one column
// per concern, mono for every number. The Vault cell shows a real per-row
// icon (or a stacked cluster for LP/multi-asset vaults) via assetsOf(), not
// a fixed icon - vaults span USDC/WETH/WBTC/DAI/USDT/LP now, not just USDC.
// chain/asset-type/vault-type ride as a subtitle line under the name, same
// icon+name+subtitle shape as StrategyColumns' protocol rows. Trimmed to
// the picker's core comparison metrics - TVL, APY, fee, one health score
// per row - rather than every field VaultSummary carries; deposit position
// and per-check risk detail live on the vault detail page instead.
// ─────────────────────────────────────────────────────────────

import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";

import type { VaultSummary } from "../../types";
import { fmtUsd, fmtFeePct } from "../../shared/format";
import { TokenIconStack, ChainIcon } from "./TokenIcon";
import { assetsOf } from "./vaultFilters";
import { ScoreCell } from "../Health/ScoreCell";
import { Chip } from "../ui/Chip";

const col = createColumnHelper<VaultSummary>();

export function buildVaultColumns(): ColumnDef<VaultSummary, any>[] {
  return [
    col.accessor("name", {
      header: "Vault",
      cell: ({ row }) => {
        const v = row.original;
        return (
          <div className="flex items-center gap-3">
            <TokenIconStack symbols={assetsOf(v)} size="lg" />
            <div className="flex flex-col gap-1.5 leading-tight">
              <span className="text-base text-body">{v.name}</span>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="flex items-center gap-1.5 font-mono text-sm text-muted/60">
                  <ChainIcon chain={v.chain} size="sm" />
                  {v.chain}
                </span>
                <Chip>{v.assetType === "stablecoin" ? "Stablecoin" : "Volatile"}</Chip>
                <Chip>{v.vaultType}</Chip>
              </div>
            </div>
          </div>
        );
      },
    }),
    col.accessor("apy", {
      header: "Est. APY",
      cell: ({ getValue }) => {
        const apy = getValue();
        return (
          <span className="font-mono text-base tabular-nums text-body">
            {Number.isFinite(apy) ? `${apy.toFixed(1)}%` : "-"}
          </span>
        );
      },
    }),
    col.accessor("tvl", {
      header: "TVL",
      cell: ({ getValue }) => {
        const tvl = getValue();
        return (
          <span className="font-mono text-base tabular-nums text-body">
            {Number.isFinite(tvl) ? fmtUsd(tvl) : "-"}
          </span>
        );
      },
    }),
    col.display({
      id: "fee",
      header: "Fee",
      cell: ({ row }) => (
        <span className="font-mono text-sm text-text-muted">
          {fmtFeePct(row.original.performanceFeePct)}
        </span>
      ),
    }),
    col.accessor("score", {
      header: "Score",
      cell: ({ getValue }) => {
        const score = getValue();
        return Number.isFinite(score) ? (
          <ScoreCell score={score} />
        ) : (
          <span className="font-mono text-sm tabular-nums text-text-muted">-</span>
        );
      },
    }),
  ];
}
