import moment from "moment";
import { TokenIcon } from "@/components/Vault/TokenIcon";
import { Address } from "@/components/ui/Address";
import { TX_TYPE_COLOR, TX_TYPE_LABEL, explorerUrl } from "@/shared/transactions";
import { fmtUsdFull } from "@/shared/format";
import type { TransactionEntry } from "@/types";

const SIGN: Record<TransactionEntry["type"], string> = {
  deposit: "+",
  withdraw: "−",
  transfer: "",
};

export function TransactionRow({ entry: e }: { entry: TransactionEntry }) {
  return (
    <li className="border-b border-hairline/60">
      <div className="flex items-start gap-3 px-4 py-3">
        <span className="mt-0.5 h-full min-h-[1.75rem] w-[2px] shrink-0" style={{ backgroundColor: TX_TYPE_COLOR[e.type] }} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider" style={{ color: TX_TYPE_COLOR[e.type] }}>
              {TX_TYPE_LABEL[e.type]}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-body">
              <TokenIcon symbol={e.asset} size="xs" />
              {e.vaultName}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 font-mono text-xs text-muted">
            <Address address={e.txHash} explorerUrl={explorerUrl(e.chain, e.txHash)} size="xs" />
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <span className="font-mono text-sm tabular-nums text-body">
            {SIGN[e.type]}
            {e.amount.toLocaleString("en-US", { maximumFractionDigits: 4 })} {e.asset}
          </span>
          <span className="font-mono text-xs tabular-nums text-muted/60">
            {e.amountUsd == null ? "-" : fmtUsdFull(e.amountUsd)}
          </span>
        </div>
        <span className="shrink-0 font-mono text-xs text-muted/50" title={e.ts}>{moment(e.ts).fromNow()}</span>
      </div>
    </li>
  );
}
