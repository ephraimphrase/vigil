import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { PiCaretDownLight, PiMagnifyingGlassLight, PiSlidersHorizontalLight } from "react-icons/pi";
import { TokenIcon } from "@/components/Vault/TokenIcon";
import {
  EMPTY_ADVANCED_FILTERS,
  type AggressivenessTier,
  type VaultFilterState,
} from "@/components/Vault/vaultFilters";
import type { VaultInfo } from "@/types";

export type { VaultFilterState } from "@/components/Vault/vaultFilters";

type AssetCategory = VaultInfo["assetType"];

interface VaultsFilterDialogProps {
  assets: string[];
  value: VaultFilterState;
  onApply: (value: VaultFilterState) => void;
}

const CATEGORIES: { id: AssetCategory; label: string }[] = [
  { id: "stablecoin", label: "Stablecoin" },
  { id: "volatile", label: "Volatile" },
];

const AGGRESSIVENESS: { id: AggressivenessTier; label: string }[] = [
  { id: "conservative", label: "Conservative" },
  { id: "moderate", label: "Moderate" },
  { id: "aggressive", label: "Aggressive" },
];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function ToggleRow({
  label,
  description,
  icon,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  icon?: ReactNode;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 border border-hairline px-3 py-2 transition-colors hover:bg-panel/60">
      <div className="flex min-w-0 items-center gap-2.5">
        {icon}
        <div className="min-w-0">
          <p className="text-sm text-body">{label}</p>
          {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
        </div>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-3.5 w-3.5 shrink-0 rounded-none border border-hairline bg-transparent accent-violet"
      />
    </label>
  );
}

function AssetPickerPanel({
  assets,
  selected,
  onChange,
  onClose,
}: {
  assets: string[];
  selected: string[];
  onChange: (assets: string[]) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const visible = useMemo(
    () => assets.filter((a) => a.toLowerCase().includes(search.toLowerCase())),
    [assets, search],
  );

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-panel p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-body leading-none">Filter by assets.</p>
          <p className="mt-1.5 text-xs text-muted">Pick one or more assets to include.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={selected.length === 0}
            onClick={() => onChange([])}
            className="rounded-full border border-hairline px-3 py-1 font-mono text-xs uppercase tracking-wider text-muted transition-colors enabled:hover:text-body disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close asset filter"
            className="flex h-5 w-5 items-center justify-center border border-transparent font-body text-sm leading-none text-muted transition-colors hover:border-hairline hover:text-body"
          >
            &times;
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 border border-hairline px-2.5 py-1.5">
        <PiMagnifyingGlassLight className="h-3.5 w-3.5 shrink-0 text-muted" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search assets"
          aria-label="Search assets"
          className="w-full bg-transparent text-sm text-body outline-none"
        />
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
        {visible.length === 0 ? (
          <span className="px-1 py-1 text-sm text-muted">No matching assets.</span>
        ) : (
          visible.map((asset) => (
            <ToggleRow
              key={asset}
              label={asset}
              icon={<TokenIcon symbol={asset} />}
              checked={selected.includes(asset)}
              onChange={() => onChange(toggle(selected, asset))}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function VaultsFilterDialog({ assets, value, onApply }: VaultsFilterDialogProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [assetPickerOpen, setAssetPickerOpen] = useState(false);
  const [showSingleAssetStrategies, setShowSingleAssetStrategies] = useState(false);
  const [showLegacyVaults, setShowLegacyVaults] = useState(false);

  useEffect(() => {
    if (open) setDraft(value);
    else setAssetPickerOpen(false);
  }, [open, value]);

  const activeCount =
    value.assetFilter.length +
    value.categoryFilter.length +
    value.aggressivenessFilter.length +
    (value.minTvl > 0 ? 1 : 0);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="flex items-center gap-1.5 rounded-full border border-hairline px-3 py-1 font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:border-hairline/40 hover:text-body">
        <PiSlidersHorizontalLight className="h-3.5 w-3.5" />
        Filters
        {activeCount > 0 && <span className="text-violet-bright">({activeCount})</span>}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-bg/70 transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 h-176 max-h-[90vh] w-3xl max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden border border-hairline bg-panel transition-all data-ending-style:scale-98 data-ending-style:opacity-0 data-starting-style:scale-98 data-starting-style:opacity-0">
          <div className="relative flex h-full flex-col overflow-y-auto p-8">
            <div className="flex items-center justify-between">
              <Dialog.Title className="font-display text-lg leading-none text-body">Filters.</Dialog.Title>
              <Dialog.Close
                aria-label="Close filters"
                className="flex h-5 w-5 items-center justify-center border border-transparent font-body text-sm leading-none text-muted transition-colors hover:border-hairline hover:text-body"
              >
                &times;
              </Dialog.Close>
            </div>

            <div className="mt-4 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <span className="font-mono text-xs uppercase tracking-wider text-muted">Underlying Asset</span>
                <button
                  type="button"
                  onClick={() => setAssetPickerOpen(true)}
                  className="flex w-full items-center justify-between gap-3 border border-hairline px-3 py-2 text-left text-sm text-body"
                >
                  {draft.assetFilter.length > 0 ? (
                    <span className="flex min-w-0 flex-wrap items-center gap-1.5">
                      {draft.assetFilter.map((asset) => (
                        <span key={asset} className="flex items-center gap-1.5">
                          <TokenIcon symbol={asset} />
                          <span className="truncate">{asset}</span>
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="truncate">Filter by assets</span>
                  )}
                  <PiCaretDownLight className="h-3.5 w-3.5 shrink-0 -rotate-90 text-muted" />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-mono text-xs uppercase tracking-wider text-muted">Minimum TVL</span>
                <div className="flex items-center gap-2 border border-hairline px-3 py-2">
                  <span className="font-mono text-sm text-muted">$</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={draft.minTvl}
                    onChange={(e) => setDraft((d) => ({ ...d, minTvl: Number(e.target.value) || 0 }))}
                    aria-label="Minimum TVL"
                    className="w-full bg-transparent font-mono text-sm text-body outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-mono text-xs uppercase tracking-wider text-muted">Asset Category</span>
                <div className="flex flex-col gap-1.5">
                  {CATEGORIES.map((c) => (
                    <ToggleRow
                      key={c.id}
                      label={c.label}
                      checked={draft.categoryFilter.includes(c.id)}
                      onChange={() =>
                        setDraft((d) => ({ ...d, categoryFilter: toggle(d.categoryFilter, c.id) }))
                      }
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="font-mono text-xs uppercase tracking-wider text-muted">
                  Vault Aggressiveness
                </span>
                <div className="flex flex-col gap-1.5">
                  {AGGRESSIVENESS.map((a) => (
                    <ToggleRow
                      key={a.id}
                      label={a.label}
                      checked={draft.aggressivenessFilter.includes(a.id)}
                      onChange={() =>
                        setDraft((d) => ({
                          ...d,
                          aggressivenessFilter: toggle(d.aggressivenessFilter, a.id),
                        }))
                      }
                    />
                  ))}
                </div>
              </div>

              <details className="border border-hairline p-3">
                <summary className="cursor-pointer font-mono text-xs uppercase tracking-wider text-body">
                  Advanced
                </summary>
                <p className="mt-2 flex items-start gap-1.5 text-xs text-muted">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-warn" />
                  It is not recommended to deposit to strategies or legacy vaults.
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  <ToggleRow
                    label="Show single asset strategies"
                    description="Checking this will show the underlying strategies used in Single Asset Vaults in the list."
                    checked={showSingleAssetStrategies}
                    onChange={() => setShowSingleAssetStrategies((v) => !v)}
                  />
                  <ToggleRow
                    label="Show legacy vaults"
                    description="Includes legacy vaults in the list."
                    checked={showLegacyVaults}
                    onChange={() => setShowLegacyVaults((v) => !v)}
                  />
                </div>
              </details>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDraft(EMPTY_ADVANCED_FILTERS)}
                className="rounded-full border border-hairline px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:text-body"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  onApply(draft);
                  setOpen(false);
                }}
                className="rounded-full bg-gradient-to-br from-violet-bright to-violet px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-white"
              >
                Save
              </button>
            </div>

            {assetPickerOpen && (
              <AssetPickerPanel
                assets={assets}
                selected={draft.assetFilter}
                onChange={(assetFilter) => setDraft((d) => ({ ...d, assetFilter }))}
                onClose={() => setAssetPickerOpen(false)}
              />
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
