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
          Deployed on {info.chain}. Liquidity, security assumptions, and gas costs all follow from that network&apos;s
          own characteristics, not Vigil&apos;s own risk model.
        </Collapsible>

        <Collapsible label="Asset type" value={info.assetType === "stablecoin" ? "Stablecoin" : "Volatile"}>
          {info.assetType === "stablecoin"
            ? "This vault holds a USD-pegged or USD-targeted asset designed to maintain its price."
            : "This vault holds an asset whose price is expected to fluctuate with the market."}
        </Collapsible>

        <Collapsible label="Vault type" value={info.vaultType}>
          Vigil&apos;s managed vaults auto-rebalance {info.asset} across several protocol strategies at once,
          targeting the policy&apos;s risk/return profile rather than wrapping a single external pool.
        </Collapsible>

        <Collapsible label="Performance fee" value={fmtFeePct(info.performanceFeePct)}>
          Claimed only from yield earned, up to the stated percentage, never from principal. Vigil charges no
          management fee.
        </Collapsible>
      </div>
    </div>
  );
}
