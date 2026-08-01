import { CornerFrame } from "@/components/ui/CornerFrame";
import { Chip } from "@/components/ui/Chip";
import { bandColor, BAND_META, resolveBand, deltaColor } from "@/shared/health";
import { fmtScore, fmtSigned } from "@/shared/format";
import type { Identity, Health } from "../types";

const LINK_LABELS: Record<string, string> = {
  website: "Site", docs: "Docs", github: "GitHub", twitter: "X",
  defillama: "DeFiLlama", explorer: "Explorer", l2beat: "L2Beat", makerburn: "MakerBurn",
};

export function Masthead({ identity, health }: { identity: Identity; health: Health }) {
  const band = resolveBand(health.score);
  const color = bandColor(health.score);

  const links = Object.entries(identity.links).filter(([k]) => k !== "audits") as [string, string][];

  return (
    <CornerFrame>
      <div className="flex flex-col gap-5 p-5 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {identity.icon ? (
              <img
                src={identity.icon}
                alt=""
                width={44}
                height={44}
                className="h-11 w-11 shrink-0 rounded-none border border-hairline bg-panel object-cover"
                loading="lazy"
              />
            ) : (
              <div className="grid h-11 w-11 place-items-center rounded-none border border-hairline bg-panel font-mono text-sm text-violet-bright">
                {(identity.ticker ?? identity.name).slice(0, 3).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="font-display text-2xl leading-none tracking-tight text-body">{identity.name}</h1>
              <div className="mt-1 flex items-center gap-2 font-mono text-xs text-muted">
                {identity.ticker && <span>{identity.ticker}</span>}
                <span className="text-muted/40">·</span>
                <span className="uppercase tracking-wider">{identity.category}</span>
                <span className="text-muted/40">·</span>
                <span>{identity.chain === "self" ? "L2" : identity.chain}</span>
              </div>
            </div>
          </div>

          <p className="max-w-xl text-sm leading-relaxed text-muted">{identity.description}</p>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs">
            {links.map(([k, url]) => (
              <a key={k} href={url} target="_blank" rel="noreferrer"
                 className="text-muted transition-colors hover:text-body">
                {LINK_LABELS[k] ?? k} <span className="text-violet-bright">{"\u2197"}</span>
              </a>
            ))}
          </div>

          {identity.links.audits && identity.links.audits.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-mono text-xs uppercase tracking-wider text-muted/60">Audits</span>
              {identity.links.audits.map((a) => <Chip key={a}>{a}</Chip>)}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-start gap-1 md:items-end">
          <div className="flex items-baseline gap-2">
            <span className="h-10 w-1 self-center" style={{ backgroundColor: color }} />
            <span className="font-display text-6xl leading-none tracking-tight text-body">
              {fmtScore(health.score)}
            </span>
            <span className="font-mono text-sm text-muted">/100</span>
          </div>
          <span className="font-mono text-xs uppercase tracking-wider" style={{ color }}>
            {BAND_META[band].label}
          </span>
          <div className="mt-1 flex items-center gap-3 font-mono text-xs">
            <span className="text-muted">24h</span>
            <span style={{ color: deltaColor(health.delta24h) }}>{fmtSigned(health.delta24h)}</span>
            <span className="text-muted">7d</span>
            <span style={{ color: deltaColor(health.delta7d) }}>{fmtSigned(health.delta7d)}</span>
          </div>
        </div>
      </div>
    </CornerFrame>
  );
}