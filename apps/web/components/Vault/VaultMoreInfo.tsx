// ─────────────────────────────────────────────────────────────
// VaultMoreInfo — the More Info tab: contract addresses, live share price,
// deployment date, and doc/analytics links. Vault/token addresses repeat
// what's already in the Vault Info tab's Addresses row - intentional,
// that's exactly how the Yearn reference duplicates them too.
// ─────────────────────────────────────────────────────────────

import type { ReactNode } from "react";
import { Address } from "@/components/ui/Address";
import { fmtDateLong } from "@/shared/format";
import type { VaultInfo } from "@/types";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-t border-hairline/60 py-3 first:border-t-0 first:pt-0">
      <span className="font-mono text-xs uppercase tracking-wider text-muted/60">{label}</span>
      {children}
    </div>
  );
}

function LinkRow({ label, href, linkLabel }: { label: string; href: string; linkLabel: string }) {
  return (
    <Row label={label}>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="font-mono text-xs text-violet-bright transition-colors hover:text-body"
      >
        {linkLabel} {"↗"}
      </a>
    </Row>
  );
}

export function VaultMoreInfo({ info }: { info: VaultInfo }) {
  return (
    <div className="flex flex-col">
      <Row label="Vault Contract Address">
        <Address address={info.vaultContractAddress} chain={info.chain} />
      </Row>
      <Row label="Token Contract Address">
        <Address address={info.tokenContractAddress} chain={info.chain} />
      </Row>
      <Row label="Current Price Per Share">
        <span className="font-mono text-xs tabular-nums text-body">{info.sharePrice.toFixed(8)}</span>
      </Row>
      <Row label="Deployed on">
        <span className="font-mono text-xs text-body">{fmtDateLong(info.deployedOn)}</span>
      </Row>
      <LinkRow label="User Documentation" href={info.docs.userDocsUrl} linkLabel="View Documentation" />
      <LinkRow label="Developer Documentation" href={info.docs.devDocsUrl} linkLabel="View Documentation" />
      <LinkRow label="Analytics Page" href={info.docs.analyticsUrl} linkLabel="View Page" />
      <LinkRow label="Vault Snapshot Data" href={info.docs.apiUrl} linkLabel="View API Data" />
    </div>
  );
}
