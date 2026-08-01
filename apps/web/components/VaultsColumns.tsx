// ─────────────────────────────────────────────────────────────
// VaultsColumns — column defs for the /dashboard/vault picker table.
// Mirrors Columns.tsx / StrategyColumns.tsx: createColumnHelper, one column
// per concern, mono for every number. Vaults never differ by asset or
// chain (always pooled USDC), so unlike Yearn's listing there's no
// asset/chain column - the real differentiator is the policy tier, folded
// into the Vault cell.
// ─────────────────────────────────────────────────────────────

import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";

import type { VaultSummary } from "../types";
import { fmtUsd, fmtUsdFull } from "../shared/format";
import { Chip } from "./ui/Chip";
import { BAND_META } from "../shared/health";

const col = createColumnHelper<VaultSummary>();
const PASS = BAND_META.hold.color;
const FAIL = BAND_META.exit.color;

export function buildVaultColumns(): ColumnDef<VaultSummary, any>[] {
  return [
    col.accessor("name", {
      header: "Vault",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="text-sm text-body">{row.original.name}</span>
          <Chip mono>{row.original.asset}</Chip>
        </div>
      ),
    }),
    col.accessor("tvl", {
      header: "TVL",
      cell: ({ getValue }) => (
        <span className="font-mono text-sm tabular-nums text-body">{fmtUsd(getValue())}</span>
      ),
    }),
    col.accessor("apy", {
      header: "Est. APY",
      cell: ({ getValue }) => (
        <span className="font-mono text-sm tabular-nums text-body">{getValue().toFixed(1)}%</span>
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
