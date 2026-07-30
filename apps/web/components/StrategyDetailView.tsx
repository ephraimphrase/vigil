"use client";

// ─────────────────────────────────────────────────────────────
// StrategyDetailView — one strategy's full record, expanding what the
// StrategiesTable row only has room to hint at (paused/retired badge,
// description tooltip). Composition only, same CornerFrame/Chip language
// as ProtocolDetailView. No data logic here - useStrategies() + find().
// ─────────────────────────────────────────────────────────────

import NextLink from "next/link";
import moment from "moment";

import { useStrategies } from "@/hooks/useStrategies";
import { CornerFrame } from "@/components/ui/CornerFrame";
import { Chip } from "@/components/ui/Chip";
import { WeightBar } from "@/components/ui/WeightBar";
import { BAND_META, resolveBand, bandColor } from "@/shared/health";
import { fmtUsd, fmtFeePct, fmtScore, fmtAddress } from "@/shared/format";
import type { Strategy } from "@/types";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-lg tabular-nums text-body">{value}</span>
      <span className="font-mono text-xs uppercase tracking-wider text-muted/60">{label}</span>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-body">{label}</span>
      {children}
    </div>
  );
}

function AddressRow({ label, value }: { label: string; value: string }) {
  return (
    <Row label={label}>
      <span className="font-mono text-xs text-muted" title={value}>{fmtAddress(value)}</span>
    </Row>
  );
}

function Masthead({ s }: { s: Strategy }) {
  const band = resolveBand(s.score);
  const color = bandColor(s.score);

  return (
    <CornerFrame>
      <div className="flex flex-col gap-5 p-5 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-none border border-hairline bg-panel font-mono text-sm text-violet-bright">
              {s.name.slice(0, 3).toUpperCase()}
            </div>
            <div>
              <h1 className="font-display text-2xl leading-none tracking-tight text-body">{s.name}</h1>
              <div className="mt-1 flex items-center gap-2 font-mono text-xs text-muted">
                <span className="uppercase tracking-wider">{s.category}</span>
                <span className="text-muted/40">·</span>
                <span>{s.want}</span>
                {s.retired && <Chip mono dotColor="#E0715F">Retired</Chip>}
                {!s.retired && s.paused && <Chip mono dotColor="#E0A95F">Paused</Chip>}
              </div>
            </div>
          </div>

          <p className="max-w-xl text-sm leading-relaxed text-muted">{s.description}</p>

          <NextLink
            href={`/dashboard/protocols/${s.protocolId}`}
            className="w-fit font-mono text-xs text-violet-bright transition-colors hover:text-body"
          >
            View {s.name} protocol health {"↗"}
          </NextLink>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-1 md:items-end">
          <div className="flex items-baseline gap-2">
            <span className="h-10 w-1 self-center" style={{ backgroundColor: color }} />
            <span className="font-display text-6xl leading-none tracking-tight text-body">{fmtScore(s.score)}</span>
            <span className="font-mono text-sm text-muted">/100</span>
          </div>
          <span className="font-mono text-xs uppercase tracking-wider" style={{ color }}>{BAND_META[band].label}</span>
          <span className="font-mono text-sm text-body">{s.apy.toFixed(1)}% APY</span>
        </div>
      </div>
    </CornerFrame>
  );
}

export function StrategyDetailView({ id }: { id: string }) {
  const data = useStrategies();
  const s = data.strategies.find((x) => x.id === id);

  if (!s) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 bg-base">
        <span className="font-mono text-xs uppercase tracking-wider text-muted">Not found</span>
        <span className="text-sm text-muted/60">No strategy matches "{id}".</span>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-4 bg-base p-4">
      <Masthead s={s} />

      {/* Position */}
      <CornerFrame>
        <div className="grid grid-cols-2 gap-4 p-5 md:grid-cols-4">
          <Stat label="Allocated" value={fmtUsd(s.allocated)} />
          <Stat label="Max Withdraw" value={fmtUsd(s.maxWithdraw)} />
          <Stat label="Max Deposit" value={s.maxDeposit === null ? "Unbounded" : fmtUsd(s.maxDeposit)} />
          <Stat label="Last Rebalance" value={moment(s.lastRebalance).fromNow()} />
        </div>
        <div className="px-5 pb-5">
          <WeightBar actual={s.actualWeight} target={s.targetWeight} />
        </div>
      </CornerFrame>

      {/* Harvest + Fees */}
      <div className="grid gap-4 md:grid-cols-2">
        <CornerFrame>
          <div className="flex flex-col gap-3 p-5">
            <span className="font-mono text-xs uppercase tracking-wider text-muted/60">Harvest</span>
            <Row label="Last harvest">
              <span className="font-mono text-sm text-muted">{moment(s.lastHarvest).fromNow()}</span>
            </Row>
            <Row label="Harvestable">
              <Chip mono dotColor={s.harvestable ? "#5FD08A" : "#9F95AB"}>{s.harvestable ? "Yes" : "No"}</Chip>
            </Row>
          </div>
        </CornerFrame>
        <CornerFrame>
          <div className="flex flex-col gap-3 p-5">
            <span className="font-mono text-xs uppercase tracking-wider text-muted/60">Fees</span>
            <Row label="Deposit">
              <span className="font-mono text-sm text-muted">{fmtFeePct(s.depositFee)}</span>
            </Row>
            <Row label="Withdraw">
              <span className="font-mono text-sm text-muted">{fmtFeePct(s.withdrawFee)}</span>
            </Row>
          </div>
        </CornerFrame>
      </div>

      {/* Contracts */}
      <CornerFrame>
        <div className="flex flex-col gap-3 p-5">
          <span className="font-mono text-xs uppercase tracking-wider text-muted/60">Contracts</span>
          <Row label="Strategy type">
            <span className="font-mono text-sm text-muted">{s.stratName}</span>
          </Row>
          <Row label="Native">
            <span className="font-mono text-sm text-muted">{s.native}</span>
          </Row>
          <Row label="Harvest on deposit">
            <Chip mono dotColor={s.harvestOnDeposit ? "#5FD08A" : "#9F95AB"}>{s.harvestOnDeposit ? "Yes" : "No"}</Chip>
          </Row>
          <Row label="Rewards">
            {s.rewards.length === 0 ? (
              <span className="font-mono text-sm text-muted/40">None</span>
            ) : (
              <div className="flex flex-wrap justify-end gap-1.5">
                {s.rewards.map((r) => <Chip key={r} mono>{r}</Chip>)}
              </div>
            )}
          </Row>
          <AddressRow label="Adapter" value={s.adapter} />
          <AddressRow label="Strategy" value={s.strategyAddress} />
          <AddressRow label="Asset" value={s.asset} />
          <AddressRow label="Want" value={s.want} />
        </div>
      </CornerFrame>
    </div>
  );
}
