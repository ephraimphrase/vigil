// ─────────────────────────────────────────────────────────────
// VaultInfoTab — the Vault Info tab: what this vault is, in Yearn's own
// field set (Addresses / Chain / Asset Type / Vault Type / Fees). Each
// field is a Collapsible - label + always-visible value collapsed, the
// explanatory blurb only mounts once expanded, matching Yearn's own
// click-to-reveal treatment. No Policy section - that's Vigil-specific and
// isn't part of what this tab is reproducing.
// ─────────────────────────────────────────────────────────────

import { Chip } from "@/components/ui/Chip";
import { Collapsible } from "@/components/ui/Collapsible";
import { Address } from "@/components/ui/Address";
import { fmtAddress, fmtFeePct } from "@/shared/format";
import type { VaultInfo } from "@/types";

export function VaultInfoTab({ info }: { info: VaultInfo }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm leading-relaxed text-muted">{info.description}</p>

      {info.features.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-xs uppercase tracking-wider text-muted/60">Additional features</span>
          {info.features.map((f) => <Chip key={f} mono>{f}</Chip>)}
        </div>
      )}

      <div>
        <Collapsible
          label="Addresses"
          value={
            <span className="font-mono text-xs text-muted">
              {fmtAddress(info.vaultContractAddress)}
            </span>
          }
        >
          <div className="flex flex-col gap-1.5">
            <span className="flex items-center gap-2">
              Vault: <Address address={info.vaultContractAddress} chain={info.chain} />
            </span>
            <span className="flex items-center gap-2">
              Token: <Address address={info.tokenContractAddress} chain={info.chain} />
            </span>
          </div>
        </Collapsible>

        <Collapsible label="Chain" value={info.chain}>
          {info.chain} mainnet — good liquidity and security, transaction costs vary with network demand.
        </Collapsible>

        <Collapsible label="Asset type" value={info.assetType === "stablecoin" ? "Stablecoin" : "Volatile"}>
          {info.assetType === "stablecoin"
            ? "This vault holds a USD-pegged or USD-targeted asset designed to maintain its price."
            : "This vault holds an asset whose price is expected to fluctuate with the market."}
        </Collapsible>

        <Collapsible label="Vault type" value={info.vaultType}>
          Vigil's managed vaults auto-rebalance USDC across several protocol strategies at once, targeting the
          policy's risk/return profile rather than wrapping a single external pool.
        </Collapsible>

        <Collapsible
          label="Fees"
          value={`${fmtFeePct(info.managementFeePct)} | ${fmtFeePct(info.performanceFeePct)}`}
        >
          Management fees are claimed from principal, pro-rated up to the stated percentage. Performance fees are
          claimed only from yield earned, up to the stated percentage.
        </Collapsible>
      </div>
    </div>
  );
}
