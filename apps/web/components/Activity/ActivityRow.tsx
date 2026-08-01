"use client";

// ─────────────────────────────────────────────────────────────
// ActivityRow — one audit-trail entry. Collapsed = a single summary line;
// expanded = the full trigger → simulation → submission → gas/retries →
// outcome stage list, plus retries / per-strategy results / proof links
// when the entry carries them. The staged rendering is the whole point:
// failure and partial states get their own visible rows, never collapsed
// into a single ✓/✗.
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import moment from "moment";
import { PiWarningOctagonLight } from "react-icons/pi";
import { Chip } from "@/components/ui/Chip";
import { AnnotationText } from "@/components/ui/AnnotationText";
import { ActivityStage } from "@/components/Activity/ActivityStage";
import { KIND_COLOR, KIND_LABEL, STAGE_COLOR } from "@/shared/activity";
import { fmtAddress } from "@/shared/format";
import type { ActivityEntry } from "@/types";

// ─── UTILS ───
function hasDetail(e: ActivityEntry): boolean {
  return Boolean(
    e.reasoning || e.stages?.length || e.retries?.length || e.strategyResults?.length ||
    e.circuitBreakerReason || e.etherscanUrl || e.x402ScanUrl
  );
}

function ProofLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="font-mono text-xs text-violet-bright transition-colors hover:text-body">
      {label} {"↗"}
    </a>
  );
}

// ─── MAIN ───
export function ActivityRow({ entry: e }: { entry: ActivityEntry }) {
  const [open, setOpen] = useState(false);
  const expandable = hasDetail(e);
  const isBreaker = e.kind === "circuit_breaker";

  return (
    <li className="border-b border-hairline/60">
      <div
        onClick={() => expandable && setOpen((v) => !v)}
        className={`flex items-start gap-3 px-4 py-3 ${expandable ? "cursor-pointer hover:bg-panel/40" : ""}`}
      >
        <span
          className="mt-0.5 h-full min-h-[1.75rem] shrink-0"
          style={{ width: isBreaker ? 3 : 2, backgroundColor: KIND_COLOR[e.kind] }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider" style={{ color: KIND_COLOR[e.kind] }}>
              {KIND_LABEL[e.kind]}
            </span>
            {isBreaker && <PiWarningOctagonLight className="h-3.5 w-3.5" style={{ color: KIND_COLOR[e.kind] }} />}
            {e.protocolId && <Chip mono>{e.protocolId.toUpperCase()}</Chip>}
            {e.approvalStatus && (
              <span className="font-mono text-xs uppercase tracking-wider text-muted">{e.approvalStatus}</span>
            )}
          </div>
          <p className={`mt-1 text-sm ${isBreaker ? "font-semibold text-body" : "text-body"}`}>{e.message}</p>
        </div>
        <span className="shrink-0 font-mono text-xs text-muted/50" title={e.ts}>{moment(e.ts).fromNow()}</span>
        {expandable && (
          <span className="mt-0.5 shrink-0 font-mono text-[10px] text-muted/40">{open ? "▾" : "▸"}</span>
        )}
      </div>

      {open && expandable && (
        <div className="flex flex-col gap-4 px-4 pb-4 pl-[calc(1rem+2px+0.75rem)]">
          {e.reasoning && (
            <div className="border-l-2 border-violet pl-3">
              <AnnotationText>{e.reasoning}</AnnotationText>
            </div>
          )}

          {e.circuitBreakerReason && (
            <div className="border-l-2 pl-3" style={{ borderColor: KIND_COLOR.circuit_breaker }}>
              <p className="text-sm text-body">{e.circuitBreakerReason}</p>
            </div>
          )}

          {e.stages && e.stages.length > 0 && (
            <ul className="divide-y divide-hairline/40 border-y border-hairline/40">
              {e.stages.map((s, i) => <ActivityStage key={i} stage={s} />)}
            </ul>
          )}

          {e.retries && e.retries.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-xs uppercase tracking-wider text-muted/60">Retries</span>
              <ul className="flex flex-col gap-1">
                {e.retries.map((r) => (
                  <li key={r.attempt} className="flex items-center gap-3 font-mono text-xs">
                    <span className="text-muted">#{r.attempt}</span>
                    <span style={{ color: r.status === "ok" ? STAGE_COLOR.ok : STAGE_COLOR.failed }}>{r.status}</span>
                    <span className="text-muted">{r.gasPriceGwei} gwei</span>
                    <span className="text-muted/60">{moment(r.ts).fromNow()}</span>
                    {r.note && <span className="text-muted/60">— {r.note}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {e.strategyResults && e.strategyResults.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-xs uppercase tracking-wider text-muted/60">
                Per-strategy result — {e.strategyResults.filter((r) => r.status === "ok").length} / {e.strategyResults.length} succeeded
              </span>
              <ul className="divide-y divide-hairline/40">
                {e.strategyResults.map((r) => (
                  <li key={r.protocolId + r.name} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                    <span className="text-body">{r.name}</span>
                    <div className="flex items-center gap-2">
                      {r.note && <span className="font-mono text-xs text-muted/60">{r.note}</span>}
                      <span
                        className="font-mono text-xs uppercase tracking-wider"
                        style={{ color: r.status === "ok" ? STAGE_COLOR.ok : STAGE_COLOR.failed }}
                      >
                        {r.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(e.gasCostUsd != null || e.mevProtected != null || e.keeperHubRef || e.etherscanUrl || e.x402ScanUrl) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-hairline/40 pt-3 font-mono text-xs text-muted">
              {e.gasCostUsd != null && <span>gas ${e.gasCostUsd.toFixed(2)}</span>}
              {e.mevProtected != null && (
                <span style={{ color: e.mevProtected ? STAGE_COLOR.ok : STAGE_COLOR.failed }}>
                  {e.mevProtected ? "MEV-protected" : "public mempool"}
                </span>
              )}
              {e.keeperHubRef && <span>keeperhub {e.keeperHubRef}</span>}
              {e.txHash && <span className="text-muted/60">{fmtAddress(e.txHash)}</span>}
              {e.etherscanUrl && <ProofLink href={e.etherscanUrl} label="Etherscan" />}
              {e.x402ScanUrl && <ProofLink href={e.x402ScanUrl} label="x402scan" />}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
